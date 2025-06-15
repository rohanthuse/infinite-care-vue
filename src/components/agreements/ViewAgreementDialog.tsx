import React, { useState } from "react";
import { Download, FileCheck, Clock, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Agreement } from "@/types/agreements";
import { format } from "date-fns";
import type { VariantProps } from "class-variance-authority";

interface ViewAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreement: Agreement | null | undefined;
  onDownload: (agreement: Agreement) => void;
}

const getStatusBadgeVariant = (status: string): VariantProps<typeof badgeVariants>["variant"] => {
  switch (status) {
    case "Active":
      return "success";
    case "Pending":
      return "info";
    case "Expired":
      return "warning";
    case "Terminated":
      return "destructive";
    default:
      return "default";
  }
};

export function ViewAgreementDialog({
  open,
  onOpenChange,
  agreement,
  onDownload
}: ViewAgreementDialogProps) {
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!agreement) {
    return null;
  }
  
  const handleStatusChange = async () => {
    if (!newStatus || !statusReason) {
      toast.error("Please select a status and provide a reason");
      return;
    }
    
    setIsUpdatingStatus(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedAgreement = {
        ...agreement,
        status: newStatus,
        statusHistory: [
          ...(agreement.statusHistory || []),
          {
            status: newStatus,
            date: new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            reason: statusReason,
            changedBy: "Current User"
          }
        ]
      };
      
      toast.success(`Agreement status updated to ${newStatus}`);
      setShowStatusForm(false);
      setNewStatus("");
      setStatusReason("");
    } catch (error) {
      toast.error("Failed to update agreement status");
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 z-10 bg-white px-6 pt-6 pb-2 border-b">
          <DialogTitle>{agreement.title}</DialogTitle>
          <DialogDescription>
            Signed by {agreement.signed_by_name} on {agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'N/A'}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-4 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge 
                variant={getStatusBadgeVariant(agreement.status)}
              >
                {agreement.status}
              </Badge>
              <span className="text-sm text-gray-500">Type: {agreement.agreement_types?.name}</span>
            </div>
            
            {agreement.signing_party && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">Signing Party:</span> {agreement.signing_party === "client" ? "Client" : "Staff"}
              </div>
            )}
            
            {agreement.digital_signature && (
              <div className="text-sm">
                <span className="font-medium">Digital Signature:</span> 
                <span className="ml-2 font-handwriting text-lg">{agreement.digital_signature}</span>
              </div>
            )}
            
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[200px] text-gray-700">
              {agreement.content}
            </div>
            
            {!showStatusForm ? (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-2 mt-4">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowStatusForm(true)}
                  className="w-full sm:w-auto"
                >
                  <FileCheck className="mr-2 h-4 w-4" /> Change Status
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowHistory(true)}
                  className="w-full sm:w-auto"
                >
                  <History className="mr-2 h-4 w-4" /> View History
                </Button>
              </div>
            ) : (
              <div className="space-y-3 border p-4 rounded-md bg-gray-50 mt-4">
                <h3 className="font-medium">Update Agreement Status</h3>
                <div>
                  <label className="text-sm font-medium">New Status</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Reason for Change</label>
                  <Textarea 
                    placeholder="Provide reason for status change"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowStatusForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleStatusChange}
                    disabled={isUpdatingStatus || !newStatus || !statusReason}
                  >
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </Button>
                </div>
              </div>
            )}
            
            {showHistory && (agreement.statusHistory?.length || 0) > 0 && (
              <div className="border p-4 rounded-md bg-gray-50 space-y-3 mt-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Status History</h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowHistory(false)}
                  >
                    Close
                  </Button>
                </div>
                <div className="space-y-2">
                  {agreement.statusHistory?.map((change, index) => (
                    <div key={index} className="border-b pb-2 last:border-0">
                      <div className="flex justify-between">
                        <Badge 
                          variant={getStatusBadgeVariant(change.status)}
                        >
                          {change.status}
                        </Badge>
                        <span className="text-sm text-gray-500">{change.date}</span>
                      </div>
                      <div className="text-sm mt-1">
                        <span className="font-medium">Reason:</span> {change.reason}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Changed by: {change.changedBy}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter className="sticky bottom-0 w-full px-6 py-4 border-t bg-white">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button 
            onClick={() => onDownload(agreement)}
          >
            <Download className="mr-2 h-4 w-4" /> 
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
