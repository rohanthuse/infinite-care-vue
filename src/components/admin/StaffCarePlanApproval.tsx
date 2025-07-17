import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  useStaffApproveCarePlan, 
  useStaffRejectCarePlan,
  useStaffCarePlanStatus 
} from '@/hooks/useStaffCarePlanApproval';
import { CheckCircle, XCircle, Clock, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface CarePlan {
  id: string;
  display_id: string;
  title: string;
  client: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  status: string;
  provider_name: string;
  staff?: {
    first_name: string;
    last_name: string;
  };
  notes?: string;
  rejection_reason?: string;
}

interface StaffCarePlanApprovalProps {
  carePlans: CarePlan[];
}

export const StaffCarePlanApproval: React.FC<StaffCarePlanApprovalProps> = ({ carePlans }) => {
  const [selectedPlan, setSelectedPlan] = useState<CarePlan | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const staffApprove = useStaffApproveCarePlan();
  const staffReject = useStaffRejectCarePlan();

  // Filter care plans that need staff approval
  const pendingApprovalPlans = carePlans.filter(plan => plan.status === 'draft');

  const handleApprove = (plan: CarePlan) => {
    setSelectedPlan(plan);
    setActionType('approve');
    setComments('');
  };

  const handleReject = (plan: CarePlan) => {
    setSelectedPlan(plan);
    setActionType('reject');
    setComments('');
    setRejectionReason('');
  };

  const confirmAction = () => {
    if (!selectedPlan) return;

    if (actionType === 'approve') {
      staffApprove.mutate({
        carePlanId: selectedPlan.id,
        comments: comments.trim() || undefined,
      });
    } else if (actionType === 'reject') {
      staffReject.mutate({
        carePlanId: selectedPlan.id,
        comments: comments.trim() || 'No comments provided',
        reason: rejectionReason.trim() || comments.trim(),
      });
    }

    setSelectedPlan(null);
    setActionType(null);
    setComments('');
    setRejectionReason('');
  };

  const cancelAction = () => {
    setSelectedPlan(null);
    setActionType(null);
    setComments('');
    setRejectionReason('');
  };

  const getStatusInfo = (plan: CarePlan) => {
    return useStaffCarePlanStatus(plan);
  };

  if (pendingApprovalPlans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Staff Care Plan Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No care plans are currently awaiting staff approval.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Care Plans Awaiting Staff Approval ({pendingApprovalPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingApprovalPlans.map((plan) => {
            const statusInfo = getStatusInfo(plan);
            return (
              <div key={plan.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{plan.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{plan.client.first_name} {plan.client.last_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {format(new Date(plan.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Plan ID: {plan.display_id}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={statusInfo.variant}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {plan.notes && (
                  <div className="bg-muted p-3 rounded">
                    <p className="text-sm">
                      <strong>Notes:</strong> {plan.notes}
                    </p>
                  </div>
                )}

                {plan.rejection_reason && (
                  <div className="bg-destructive/10 p-3 rounded border border-destructive/20">
                    <p className="text-sm text-destructive">
                      <strong>Previous Rejection:</strong> {plan.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(plan)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(plan)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Request Changes
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!selectedPlan && !!actionType} onOpenChange={cancelAction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve Care Plan' : 'Request Changes'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedPlan?.title}</p>
              <p className="text-sm text-muted-foreground">
                Client: {selectedPlan?.client.first_name} {selectedPlan?.client.last_name}
              </p>
            </div>

            {actionType === 'reject' && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Reason for Changes *
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please specify what changes are needed..."
                  className="min-h-[80px]"
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                {actionType === 'approve' ? 'Comments (Optional)' : 'Additional Comments'}
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? "Add any comments for the care team..."
                    : "Additional feedback or instructions..."
                }
                className="min-h-[80px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cancelAction}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                (actionType === 'reject' && !rejectionReason.trim()) ||
                staffApprove.isPending ||
                staffReject.isPending
              }
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {staffApprove.isPending || staffReject.isPending ? 'Processing...' : 
               actionType === 'approve' ? 'Approve & Send to Client' : 'Request Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};