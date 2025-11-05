import React, { useState, useEffect } from "react";
import { Download, FileCheck, Clock, History, AlertCircle, Users, PenLine, FileText, Eye, Check } from "lucide-react";
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
      <DialogContent className="max-w-[85vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="sticky top-0 z-10 bg-gradient-to-r from-background to-muted/30 px-8 pt-6 pb-4 border-b shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{agreement.title}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {signersLoading ? (
                  "Loading signers..."
                ) : signers.length > 0 ? (
                  `${signers.length} ${signers.length === 1 ? 'party' : 'parties'} • ${agreement.signed_at ? 'Signed ' + format(new Date(agreement.signed_at), 'dd MMM yyyy') : 'Pending signatures'}`
                ) : (
                  `Created ${agreement.created_at ? format(new Date(agreement.created_at), 'dd MMM yyyy') : 'N/A'}`
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto scroll-smooth">
          <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 p-6">
            
            {/* LEFT PANEL - Agreement Details */}
            <div className="space-y-6">
              {/* Status & Type */}
              <div className="flex justify-between items-center pb-4 border-b">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Status</h3>
                  <Badge variant={getStatusBadgeVariant(agreement.status)} className="text-sm">
                    {agreement.status}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Type</h3>
                  <p className="text-sm font-medium">{agreement.agreement_types?.name}</p>
                </div>
              </div>
              
              {/* Your Status (for non-admins) */}
              {!isAdmin && currentUserSigner && (
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Status</h3>
                  <Badge 
                    variant={currentUserSigner.signing_status === 'signed' ? 'success' : 'outline'} 
                    className="text-sm"
                  >
                    {currentUserSigner.signing_status === 'signed' ? 'Signed ✓' : 'Pending Signature'}
                  </Badge>
                </div>
              )}
              
              {/* Signers List (Admin only) */}
              {isAdmin && signers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Signers ({signers.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {signers.map((signer) => (
                      <Badge 
                        key={signer.id} 
                        variant={signer.signing_status === 'signed' ? 'success' : 'outline'}
                      >
                        {signer.signer_name} 
                        <span className="ml-1 text-xs opacity-70">({signer.signer_type})</span>
                        {signer.signing_status === 'signed' && ' ✓'}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Agreement Content */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Agreement Content</h3>
                <div className="prose prose-sm max-w-none p-5 bg-muted/20 rounded-lg border min-h-[300px]">
                  {agreement.content}
                </div>
              </div>
              
              {/* Dates Section */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg border">
                {agreement.created_at && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Created</p>
                    <p className="text-sm font-medium">{format(new Date(agreement.created_at), 'dd MMM yyyy')}</p>
                  </div>
                )}
                {agreement.expiry_date && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Expires</p>
                    <p className="text-sm font-medium">{format(new Date(agreement.expiry_date), 'dd MMM yyyy')}</p>
                  </div>
                )}
              </div>
              
              {/* Admin Action Buttons */}
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setShowStatusForm(true)}>
                    <FileCheck className="mr-2 h-4 w-4" /> Change Status
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
                    <History className="mr-2 h-4 w-4" /> View History
                  </Button>
                </div>
              )}
            </div>
            
            {/* RIGHT PANEL - Documents & Signatures */}
            <div className="space-y-6 lg:border-l lg:pl-6">
              
              {/* Action Required Banner (if pending signature) */}
              {currentUserSigner && agreement.status === 'Pending' && (
                <div className="sticky top-0 z-10 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Action Required</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    Review the agreement and sign below to acknowledge.
                  </p>
                  
                  {!showSigningCanvas ? (
                    <Button 
                      onClick={() => setShowSigningCanvas(true)} 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <PenLine className="mr-2 h-4 w-4" />
                      Sign Now
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <EnhancedSignatureCanvas
                        onSignatureSave={setCurrentSignature}
                        agreementId={agreement.id}
                        disabled={signMutation.isPending}
                      />
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowSigningCanvas(false);
                            setCurrentSignature("");
                          }}
                          disabled={signMutation.isPending}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={handleSignAgreement}
                          disabled={!currentSignature || signMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {signMutation.isPending ? 'Submitting...' : 'Done ✓'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Agreement Documents Section */}
              {agreement.agreement_files && agreement.agreement_files.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Agreement Documents</h3>
                    <Badge variant="secondary" className="ml-auto">
                      {agreement.agreement_files.filter(f => f.file_category !== 'signature').length}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {agreement.agreement_files
                      .filter(file => file.file_category !== 'signature')
                      .map((file) => {
                        const fileUrl = `https://vcrjntfjsmpoupgairep.supabase.co/storage/v1/object/public/agreement-files/${file.storage_path}`;
                        
                        return (
                          <div 
                            key={file.id} 
                            className="group p-4 bg-card border rounded-lg hover:shadow-lg transition-all hover:border-primary/50"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 bg-primary/10 rounded-md">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{file.file_name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {(file.file_size / 1024).toFixed(1)} KB
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(file.created_at), 'dd MMM yyyy')}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => window.open(fileUrl, '_blank')}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = fileUrl;
                                  link.download = file.file_name;
                                  link.click();
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
              
              {/* Digital Signatures Section */}
              {(agreement.digital_signature || signers.some(s => s.signing_status === 'signed')) && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <PenLine className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Digital Signatures</h3>
                  </div>
                  
                  {/* Admin/Creator Signature */}
                  {agreement.digital_signature && (
                    <div className="p-4 bg-card border rounded-lg space-y-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Agreement Creator
                      </p>
                      
                      {agreement.digital_signature.startsWith('data:image') ? (
                        <div className="bg-white border rounded-md p-3 flex items-center justify-center">
                          <img 
                            src={agreement.digital_signature} 
                            alt="Digital Signature" 
                            className="max-h-20 max-w-full object-contain"
                            onError={(e) => {
                              console.error('Failed to load signature image');
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <p className="font-handwriting text-2xl text-center py-2">
                          {agreement.digital_signature}
                        </p>
                      )}
                      
                      {agreement.signed_at && (
                        <p className="text-xs text-muted-foreground text-center">
                          Signed {format(new Date(agreement.signed_at), 'dd MMM yyyy, HH:mm')}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Other Signers (Admin view) */}
                  {isAdmin && signers.filter(s => s.signing_status === 'signed').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Other Signers
                      </p>
                      {signers
                        .filter(s => s.signing_status === 'signed')
                        .map(signer => (
                          <div key={signer.id} className="p-3 bg-muted/30 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm">{signer.signer_name}</p>
                              <Badge variant="success" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                Signed
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">
                              {signer.signer_type}
                            </p>
                            {signer.signed_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(signer.signed_at), 'dd MMM yyyy, HH:mm')}
                              </p>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Download Agreement Button */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onDownload(agreement)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Full Agreement
              </Button>
            </div>
          </div>
        </ScrollArea>
        
        {/* Admin Status Form Modal */}
        {isAdmin && showStatusForm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowStatusForm(false)}>
            <div className="bg-white rounded-lg p-6 space-y-4 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-medium text-lg">Update Agreement Status</h3>
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
          </div>
        )}
        
        {/* History Modal */}
        {showHistory && (agreement.statusHistory?.length || 0) > 0 && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowHistory(false)}>
            <div className="bg-white rounded-lg p-6 space-y-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-lg">Status History</h3>
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
          </div>
        )}
        
        {/* Admin Approval Panel */}
        {isAdmin && agreement && (
          <div className="px-6 pb-4 border-t pt-4">
            <AdminApprovalPanel agreement={agreement} onClose={() => onOpenChange(false)} />
          </div>
        )}
        
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
