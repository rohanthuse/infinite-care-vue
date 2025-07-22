
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, AlertCircle } from 'lucide-react';
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
      <Card className="border-2 border-dashed border-muted">
        <CardHeader className="text-center py-8">
          <CardTitle className="flex items-center justify-center gap-3 text-green-600">
            <CheckCircle className="h-6 w-6" />
            Staff Care Plan Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-muted-foreground text-lg">
            No care plans are currently awaiting staff approval.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            All care plans have been processed or are in other stages of review.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm border-l-4 border-l-amber-500">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
          <CardTitle className="flex items-center gap-3 text-amber-700">
            <Clock className="h-6 w-6" />
            Care Plans Awaiting Staff Approval
            <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-800 font-semibold">
              {pendingApprovalPlans.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {pendingApprovalPlans.map((plan) => {
            const statusInfo = getStatusInfo(plan);
            return (
              <div key={plan.id} className="bg-card border-2 border-muted/50 rounded-xl p-6 space-y-4 hover:border-muted transition-colors">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg text-foreground">{plan.title}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">Client:</span>
                        <span>{plan.client.first_name} {plan.client.last_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span className="font-medium">Created:</span>
                        <span>{format(new Date(plan.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-medium">Plan ID:</span>
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {plan.display_id}
                      </code>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge variant={statusInfo.variant} className="font-medium">
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>

                {plan.notes && (
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">Notes</p>
                        <p className="text-sm text-blue-800">{plan.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {plan.rejection_reason && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900 mb-1">Previous Rejection Reason</p>
                        <p className="text-sm text-red-800">{plan.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-muted/50">
                  <Button
                    size="sm"
                    onClick={() => handleApprove(plan)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 transition-all duration-200 hover:shadow-md"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Plan
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(plan)}
                    className="flex items-center gap-2 font-medium px-4 py-2 transition-all duration-200 hover:shadow-md"
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

      {/* Enhanced Professional Dialog */}
      <Dialog open={!!selectedPlan && !!actionType} onOpenChange={cancelAction}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-4 pb-6 border-b border-muted/30">
            <div className="flex items-center gap-3">
              {actionType === 'approve' ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <DialogTitle className="text-2xl font-bold text-foreground">
                {actionType === 'approve' ? 'Approve Care Plan' : 'Request Changes'}
              </DialogTitle>
            </div>
            <p className="text-muted-foreground">
              {actionType === 'approve' 
                ? 'This care plan will be sent to the client for signature after approval.'
                : 'The care plan will be returned to draft status with your feedback.'
              }
            </p>
          </DialogHeader>
          
          <div className="space-y-8 py-6 max-h-[60vh] overflow-y-auto">
            {/* Care Plan Information Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6 rounded-xl space-y-4">
              <div className="flex items-center gap-2 text-blue-800 font-semibold">
                <FileText className="h-5 w-5" />
                Care Plan Details
              </div>
              
              <div className="grid gap-3">
                <h4 className="font-bold text-lg text-blue-900">{selectedPlan?.title}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-blue-700">
                    <User className="h-4 w-4" />
                    <span className="font-medium">Client:</span>
                    <span>{selectedPlan?.client.first_name} {selectedPlan?.client.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Created:</span>
                    <span>{selectedPlan && format(new Date(selectedPlan.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <span className="font-medium">Plan ID:</span>
                  <code className="bg-blue-100 px-3 py-1 rounded font-mono text-xs">
                    {selectedPlan?.display_id}
                  </code>
                </div>
              </div>
            </div>

            {/* Rejection Reason Section */}
            {actionType === 'reject' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-semibold">
                  <AlertCircle className="h-5 w-5" />
                  Reason for Changes Required
                </div>
                <div className="space-y-3">
                  <Label htmlFor="rejection-reason" className="text-base font-semibold text-foreground">
                    What changes are needed? *
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide specific details about what needs to be changed in this care plan..."
                    className="min-h-[120px] resize-none border-2 border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all duration-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Be specific about the changes needed to help the care team understand your requirements.
                  </p>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-semibold">
                <FileText className="h-5 w-5" />
                {actionType === 'approve' ? 'Additional Comments' : 'Additional Feedback'}
              </div>
              <div className="space-y-3">
                <Label htmlFor="comments" className="text-base font-semibold text-foreground">
                  {actionType === 'approve' ? 'Comments (Optional)' : 'Additional Feedback'}
                </Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? "Add any additional comments or instructions for the care team..."
                      : "Provide any additional context or instructions..."
                  }
                  className="min-h-[100px] resize-none border-2 border-muted focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                />
                <p className="text-xs text-muted-foreground">
                  {actionType === 'approve' 
                    ? 'These comments will be visible to the care team and client.'
                    : 'Additional context can help ensure the changes are made correctly.'
                  }
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t border-muted/30 gap-4">
            <Button 
              variant="outline" 
              onClick={cancelAction}
              className="min-w-[120px] font-medium"
              disabled={staffApprove.isPending || staffReject.isPending}
            >
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
              className={`min-w-[160px] font-semibold transition-all duration-200 ${
                actionType === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg' 
                  : 'shadow-md hover:shadow-lg'
              }`}
            >
              {staffApprove.isPending || staffReject.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {actionType === 'approve' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve & Send to Client
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Request Changes
                    </>
                  )}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
