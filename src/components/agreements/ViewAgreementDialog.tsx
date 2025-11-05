import React, { useState, useEffect } from "react";
import { Download, FileCheck, Clock, History, AlertCircle, Users, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAgreementSigners } from "@/hooks/useAgreementSigners";
import { useSignAgreementBySigner } from "@/hooks/useSignAgreementBySigner";
import { useAuth } from "@/contexts/UnifiedAuthProvider";
import { EnhancedSignatureCanvas } from "./EnhancedSignatureCanvas";
import { AdminApprovalPanel } from "./AdminApprovalPanel";
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
  const { user } = useAuth();
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSigningCanvas, setShowSigningCanvas] = useState(false);
  const [currentSignature, setCurrentSignature] = useState("");
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const { data: signers = [], isLoading: signersLoading } = useAgreementSigners(agreement?.id);
  const signMutation = useSignAgreementBySigner();
  
  // Fetch user roles
  useEffect(() => {
    const fetchRoles = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      setUserRoles(data?.map(r => r.role) || []);
    };
    fetchRoles();
  }, [user?.id]);
  
  const isAdmin = userRoles.includes('super_admin') || userRoles.includes('branch_admin');
  
  // Find current user's signer record (if they're a pending signer)
  const currentUserSigner = signers.find(
    s => s.signer_auth_user_id === user?.id && s.signing_status === 'pending'
  );

  if (!agreement) {
    return null;
  }
  
  const handleSignAgreement = async () => {
    if (!currentSignature || !currentUserSigner || !agreement) {
      toast.error("Please provide a signature");
      return;
    }
    
    try {
      await signMutation.mutateAsync({
        agreementId: agreement.id,
        signerId: currentUserSigner.id,
        signatureData: currentSignature
      });
      
      setShowSigningCanvas(false);
      setCurrentSignature("");
      onOpenChange(false);
    } catch (error) {
      console.error('Signing error:', error);
    }
  };
  
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
            {signersLoading ? (
              "Loading signers..."
            ) : signers.length > 0 ? (
              `Signed by ${signers.length} ${signers.length === 1 ? 'party' : 'parties'} on ${agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'N/A'}`
            ) : (
              `Created on ${agreement.created_at ? format(new Date(agreement.created_at), 'dd MMM yyyy') : 'N/A'}`
            )}
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
            
            {/* Show full signers list only to admins */}
            {isAdmin && signers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  <span>Signers ({signers.length}):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {signers.map((signer) => (
                    <Badge 
                      key={signer.id} 
                      variant={signer.signing_status === 'signed' ? 'success' : 'outline'} 
                      className="text-sm"
                    >
                      {signer.signer_name}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({signer.signer_type})
                      </span>
                      {signer.signing_status === 'signed' && (
                        <span className="ml-1 text-xs">✓</span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* For non-admins, show only their own signing status */}
            {!isAdmin && currentUserSigner && (
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Your Status:</span>
                  <Badge 
                    variant={currentUserSigner.signing_status === 'signed' ? 'success' : 'outline'} 
                    className="ml-2"
                  >
                    {currentUserSigner.signing_status === 'signed' ? 'Signed ✓' : 'Pending Signature'}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Show signing interface if user is a pending signer */}
            {currentUserSigner && agreement.status === 'Pending' && (
              <div className="border p-4 rounded-md bg-blue-50 space-y-3 mt-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Action Required: Your Signature</h3>
                </div>
                <p className="text-sm text-blue-800">
                  You are listed as a signer on this agreement. Please review the content above and sign below.
                </p>
                
                {!showSigningCanvas ? (
                  <Button 
                    onClick={() => setShowSigningCanvas(true)} 
                    className="w-full"
                    variant="default"
                  >
                    <PenLine className="mr-2 h-4 w-4" />
                    Sign Agreement
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <EnhancedSignatureCanvas
                      onSignatureSave={setCurrentSignature}
                      agreementId={agreement.id}
                      disabled={signMutation.isPending}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowSigningCanvas(false);
                          setCurrentSignature("");
                        }}
                        disabled={signMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSignAgreement}
                        disabled={!currentSignature || signMutation.isPending}
                      >
                        {signMutation.isPending ? 'Signing...' : 'Submit Signature'}
                      </Button>
                    </div>
                  </div>
                )}
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
            
            {/* Status change and history - Admin only */}
            {isAdmin && !showStatusForm && (
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
            )}
            
            {isAdmin && showStatusForm && (
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
            
            {/* Admin Approval Panel */}
            {isAdmin && agreement && (
              <AdminApprovalPanel agreement={agreement} onClose={() => onOpenChange(false)} />
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
