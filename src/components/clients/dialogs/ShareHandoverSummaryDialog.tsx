import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useSearchableStaff, EnhancedStaff } from "@/hooks/useSearchableStaff";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Search, 
  User, 
  AlertCircle, 
  Send, 
  Loader2,
  CheckCircle2
} from "lucide-react";
import { 
  HandoverSummaryPdfData, 
  generateHandoverSummaryPDF 
} from "@/utils/handoverSummaryPdfGenerator";

interface ShareHandoverSummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  pdfData: HandoverSummaryPdfData;
  clientName: string;
}

export function ShareHandoverSummaryDialog({
  open,
  onOpenChange,
  branchId,
  pdfData,
  clientName
}: ShareHandoverSummaryDialogProps) {
  const { toast } = useToast();
  const [selectedStaff, setSelectedStaff] = useState<EnhancedStaff | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  
  const {
    staff,
    isLoading,
    setSearchTerm,
  } = useSearchableStaff(branchId);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, setSearchTerm]);

  // Filter staff with email
  const staffWithEmail = useMemo(() => {
    return staff.filter(s => s.email && s.email.trim() !== '');
  }, [staff]);

  const handleSelectStaff = (staffMember: EnhancedStaff) => {
    setSelectedStaff(staffMember);
  };

  const handleSendEmail = async () => {
    if (!selectedStaff?.email) {
      toast({
        title: "No email address",
        description: "The selected carer does not have a registered email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    
    try {
      // Generate PDF
      const pdfBlob = await generateHandoverSummaryPDF(pdfData, branchId);
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(pdfBlob);
      
      const pdfBase64 = await base64Promise;
      
      // Get current user for sender name
      const { data: { user } } = await supabase.auth.getUser();
      let senderName = 'Admin';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          senderName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin';
        }
      }
      
      // Get branch name
      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('id', branchId)
        .single();
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-handover-summary-email', {
        body: {
          recipientEmail: selectedStaff.email,
          recipientName: selectedStaff.full_name,
          clientName: clientName,
          pdfBase64: pdfBase64,
          senderName: senderName,
          branchName: branchData?.name
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Email sent successfully",
        description: `Handover summary sent to ${selectedStaff.full_name}`,
      });
      
      onOpenChange(false);
      setSelectedStaff(null);
      setSearchInput("");
      
    } catch (error: any) {
      console.error('Error sending handover summary email:', error);
      toast({
        title: "Failed to send email",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      onOpenChange(false);
      setSelectedStaff(null);
      setSearchInput("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Share via Email
          </DialogTitle>
          <DialogDescription>
            Select a carer to send the handover summary for {clientName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search carers..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Staff List */}
          <div className="border rounded-md">
            <ScrollArea className="h-[200px]">
              {isLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : staffWithEmail.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No carers with email found</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {staffWithEmail.map((staffMember) => (
                    <button
                      key={staffMember.id}
                      onClick={() => handleSelectStaff(staffMember)}
                      className={`w-full text-left p-3 rounded-md transition-colors flex items-center justify-between gap-2 ${
                        selectedStaff?.id === staffMember.id
                          ? 'bg-primary/10 border border-primary'
                          : 'hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">
                            {staffMember.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {staffMember.email}
                          </p>
                        </div>
                      </div>
                      {selectedStaff?.id === staffMember.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          {/* Selected Staff Preview */}
          {selectedStaff && (
            <div className="bg-muted/50 rounded-md p-3 space-y-2">
              <Label className="text-xs text-muted-foreground">Sending to:</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{selectedStaff.full_name}</span>
                <Badge variant="secondary" className="text-xs">
                  {selectedStaff.email}
                </Badge>
              </div>
            </div>
          )}
          
          {/* Warning for staff without email */}
          {staff.length > 0 && staffWithEmail.length < staff.length && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                {staff.length - staffWithEmail.length} carer(s) without registered email are hidden
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={!selectedStaff || isSending}
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
