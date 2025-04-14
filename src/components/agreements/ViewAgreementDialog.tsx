
import React, { useState } from "react";
import { Download, FileCheck, Clock, History, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Agreement {
  id: number;
  title: string;
  signedBy: string;
  signedDate: string;
  type: string;
  status: string;
  content: string;
  signingParty?: "client" | "staff";
  digitalSignature?: string;
  statusHistory?: StatusChange[];
  clientId?: string;
  staffId?: string;
}

interface StatusChange {
  status: string;
  date: string;
  reason?: string;
  changedBy: string;
}

interface ViewAgreementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agreementId: number | null;
  agreements: Agreement[];
  onDownload: (id: number) => void;
}

export function ViewAgreementDialog({
  open,
  onOpenChange,
  agreementId,
  agreements,
  onDownload
}: ViewAgreementDialogProps) {
  const agreement = agreements.find(a => a.id === agreementId) || null;
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Expired":
        return "bg-amber-100 text-amber-800";
      case "Terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{agreement.title}</DialogTitle>
          <DialogDescription>
            Signed by {agreement.signedBy} on {agreement.signedDate}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 px-6 py-2 max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge 
                className={getStatusBadgeClass(agreement.status)}
              >
                {agreement.status}
              </Badge>
              <span className="text-sm text-gray-500">Type: {agreement.type}</span>
            </div>
            
            {agreement.signingParty && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">Signing Party:</span> {agreement.signingParty === "client" ? "Client" : "Staff"}
              </div>
            )}
            
            {agreement.digitalSignature && (
              <div className="text-sm">
                <span className="font-medium">Digital Signature:</span> 
                <span className="ml-2 font-handwriting text-lg">{agreement.digitalSignature}</span>
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
                          className={getStatusBadgeClass(change.status)}
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
        
        <DialogFooter className="px-6 py-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button 
            onClick={() => onDownload(agreement.id)}
          >
            <Download className="mr-2 h-4 w-4" /> 
            Download PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
