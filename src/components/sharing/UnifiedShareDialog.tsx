import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Share2, Users, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { shareViaWebAPI, shareWithStaff, downloadFile, ShareRecord } from "@/utils/sharingUtils";
import { MultiSelect } from "@/components/ui/multi-select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UnifiedShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentId: string;
  contentType: 'event' | 'report' | 'agreement';
  contentTitle: string;
  branchId: string;
  onGeneratePDF: () => Promise<Blob>;
  reportType?: string;
  reportData?: any;
  fileFormat?: 'pdf' | 'csv' | 'excel';
}

export function UnifiedShareDialog({
  open,
  onOpenChange,
  contentId,
  contentType,
  contentTitle,
  branchId,
  onGeneratePDF,
  reportType,
  reportData,
  fileFormat = 'pdf',
}: UnifiedShareDialogProps) {
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [shareNote, setShareNote] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState("web");

  // Fetch staff for the branch
  const { data: staffList = [] } = useQuery({
    queryKey: ['staff', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('branch_id', branchId)
        .eq('status', 'Active');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });

  const staffOptions = staffList.map(staff => ({
    value: staff.id,
    label: `${staff.first_name} ${staff.last_name}`,
  }));

  const handleWebShare = async () => {
    setIsSharing(true);
    try {
      const pdfBlob = await onGeneratePDF();
      const fileName = `${contentTitle.replace(/\s+/g, '_')}.pdf`;
      await shareViaWebAPI(pdfBlob, fileName, contentTitle);
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to generate or share content");
    } finally {
      setIsSharing(false);
    }
  };

  const handleInternalShare = async () => {
    if (selectedStaff.length === 0) {
      toast.error("Please select at least one staff member");
      return;
    }

    setIsSharing(true);
    try {
      const shareData: ShareRecord = {
        contentId,
        contentType,
        sharedWith: selectedStaff,
        shareMethod: 'internal',
        shareNote: shareNote || undefined,
        reportType,
        reportData,
        branchId,
        fileFormat,
      };

      const success = await shareWithStaff(shareData);
      
      if (success) {
        setSelectedStaff([]);
        setShareNote("");
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error sharing internally:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownload = async () => {
    setIsSharing(true);
    try {
      const pdfBlob = await onGeneratePDF();
      const fileName = `${contentTitle.replace(/\s+/g, '_')}.pdf`;
      downloadFile(pdfBlob, fileName);
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error("Failed to generate or download content");
    } finally {
      setIsSharing(false);
    }
  };

  const supportsWebShare = navigator.share !== undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share {contentType === 'event' ? 'Event Log' : contentType === 'report' ? 'Report' : 'Agreement'}
          </DialogTitle>
          <DialogDescription>
            Share "{contentTitle}" with your team or download it
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {supportsWebShare && (
              <TabsTrigger value="web">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </TabsTrigger>
            )}
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
            <TabsTrigger value="download">
              <Download className="h-4 w-4 mr-2" />
              Download
            </TabsTrigger>
          </TabsList>

          {supportsWebShare && (
            <TabsContent value="web" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share this {contentType} using your device's native sharing options
              </p>
              <Button
                onClick={handleWebShare}
                disabled={isSharing}
                className="w-full"
              >
                {isSharing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share via Device
                  </>
                )}
              </Button>
            </TabsContent>
          )}

          <TabsContent value="team" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="staff-select">Select Team Members</Label>
              <MultiSelect
                options={staffOptions}
                selected={selectedStaff}
                onSelectionChange={setSelectedStaff}
                placeholder="Select staff members..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="share-note">Add a Note (Optional)</Label>
              <Textarea
                id="share-note"
                placeholder="Add a message for the recipients..."
                value={shareNote}
                onChange={(e) => setShareNote(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleInternalShare}
              disabled={isSharing || selectedStaff.length === 0}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Share with {selectedStaff.length || 0} {selectedStaff.length === 1 ? 'Person' : 'People'}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="download" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download this {contentType} as a PDF file to your device
            </p>
            <Button
              onClick={handleDownload}
              disabled={isSharing}
              className="w-full"
            >
              {isSharing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
