import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Archive,
  Clock
} from "lucide-react";
import { useApproveAgreement } from "@/hooks/useApproveAgreement";
import { useArchiveAgreement } from "@/hooks/useArchiveAgreement";
import { Agreement } from "@/types/agreements";
import { format } from "date-fns";
import { toast } from "sonner";

interface AdminApprovalPanelProps {
  agreement: Agreement;
  onClose?: () => void;
}

export const AdminApprovalPanel = ({ agreement, onClose }: AdminApprovalPanelProps) => {
  const [notes, setNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  
  const approveMutation = useApproveAgreement();
  const archiveMutation = useArchiveAgreement();
  
  const handleApprove = async () => {
    await approveMutation.mutateAsync({
      agreementId: agreement.id,
      action: 'approve',
      notes
    });
    onClose?.();
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    
    await approveMutation.mutateAsync({
      agreementId: agreement.id,
      action: 'reject',
      notes,
      rejectionReason
    });
    onClose?.();
  };
  
  const handleArchive = async () => {
    if (window.confirm("Archive this agreement? It will be moved to archived agreements.")) {
      await archiveMutation.mutateAsync(agreement.id);
      onClose?.();
    }
  };
  
  // Determine approval status badge
  const getApprovalStatusBadge = () => {
    switch (agreement.approval_status) {
      case 'pending_signatures':
        return <Badge variant="info"><Clock className="h-3 w-3 mr-1" />Awaiting Signatures</Badge>;
      case 'pending_review':
        return <Badge variant="warning"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'archived':
        return <Badge variant="secondary"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return null;
    }
  };
  
  // Only show approval actions if status is pending_review
  const canApprove = agreement.approval_status === 'pending_review';
  const canArchive = agreement.approval_status === 'approved';
  const isRejected = agreement.approval_status === 'rejected';
  
  return (
    <Card className="p-4 space-y-4 bg-muted/30 border-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Admin Review Panel</h3>
        {getApprovalStatusBadge()}
      </div>
      
      {/* Show approval history if exists */}
      {agreement.approved_at && (
        <div className="text-sm space-y-1 p-3 bg-card rounded-md">
          <p className="text-muted-foreground">
            {agreement.approval_status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
            {format(new Date(agreement.approved_at), 'dd MMM yyyy, HH:mm')}
          </p>
          {agreement.approval_notes && (
            <p className="text-sm"><strong>Notes:</strong> {agreement.approval_notes}</p>
          )}
          {agreement.rejection_reason && (
            <p className="text-sm text-destructive">
              <strong>Rejection Reason:</strong> {agreement.rejection_reason}
            </p>
          )}
        </div>
      )}
      
      {/* Approval actions for pending_review */}
      {canApprove && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">Action Required</p>
                <p className="text-blue-700">
                  All signers have completed their signatures. Please review and approve or reject this agreement.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this review..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          {!showRejectForm ? (
            <div className="flex gap-2">
              <Button 
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {approveMutation.isPending ? 'Approving...' : 'Approve Agreement'}
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowRejectForm(true)}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-destructive">
                  Rejection Reason (Required)
                </label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="border-destructive"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="destructive"
                  onClick={handleReject}
                  disabled={approveMutation.isPending || !rejectionReason.trim()}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {approveMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Archive action for approved agreements */}
      {canArchive && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-medium">Agreement Approved</p>
                <p className="text-green-700">
                  This agreement has been approved and is now active. You can archive it when no longer needed.
                </p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            className="w-full"
          >
            <Archive className="h-4 w-4 mr-2" />
            {archiveMutation.isPending ? 'Archiving...' : 'Archive Agreement'}
          </Button>
        </div>
      )}
      
      {/* Show info for rejected agreements */}
      {isRejected && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-medium">Agreement Rejected</p>
              <p className="text-red-700">
                This agreement was rejected and has been terminated.
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
