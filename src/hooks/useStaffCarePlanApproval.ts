
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StaffApproveCarePlanData {
  carePlanId: string;
  comments?: string;
}

interface StaffRejectCarePlanData {
  carePlanId: string;
  comments: string;
  reason: string;
}

// Staff approve care plan
const staffApproveCarePlan = async ({ carePlanId, comments }: StaffApproveCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[staffApproveCarePlan] Approving care plan ${carePlanId}`);

  // Update care plan status to approved
  const { error: updateError } = await supabase
    .from('client_care_plans')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId);

  if (updateError) {
    console.error('Error approving care plan:', updateError);
    throw updateError;
  }

  // Create approval record
  const { error: approvalError } = await supabase
    .from('client_care_plan_approvals')
    .insert({
      care_plan_id: carePlanId,
      action: 'approved',
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      comments: comments || 'Care plan approved by staff',
      previous_status: 'pending_approval',
      new_status: 'approved'
    });

  if (approvalError) {
    console.error('Error creating approval record:', approvalError);
    // Don't fail the operation for this
  }

  return { success: true };
};

// Staff reject care plan
const staffRejectCarePlan = async ({ carePlanId, comments, reason }: StaffRejectCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[staffRejectCarePlan] Rejecting care plan ${carePlanId}`);

  // Update care plan status to rejected
  const { error: updateError } = await supabase
    .from('client_care_plans')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId);

  if (updateError) {
    console.error('Error rejecting care plan:', updateError);
    throw updateError;
  }

  // Create approval record
  const { error: approvalError } = await supabase
    .from('client_care_plan_approvals')
    .insert({
      care_plan_id: carePlanId,
      action: 'rejected',
      performed_by: user.id,
      performed_at: new Date().toISOString(),
      comments: comments,
      previous_status: 'pending_approval',
      new_status: 'rejected'
    });

  if (approvalError) {
    console.error('Error creating approval record:', approvalError);
    // Don't fail the operation for this
  }

  return { success: true };
};

export const useStaffApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApproveCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.success('Care plan approved successfully! The client will be notified.');
    },
    onError: (error) => {
      console.error('Failed to approve care plan:', error);
      toast.error('Failed to approve care plan. Please try again.');
    },
  });
};

export const useStaffRejectCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffRejectCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.success('Care plan rejected. The client will be notified of the requested changes.');
    },
    onError: (error) => {
      console.error('Failed to reject care plan:', error);
      toast.error('Failed to reject care plan. Please try again.');
    },
  });
};

// Hook to get care plan status info for staff
export const useStaffCarePlanStatus = (carePlan: any) => {
  if (!carePlan) return { status: 'unknown', label: 'Unknown', variant: 'secondary' as const };

  switch (carePlan.status) {
    case 'draft':
      return { 
        status: 'draft', 
        label: 'Awaiting Staff Approval', 
        variant: 'destructive' as const 
      };
    case 'pending_approval':
      return { 
        status: 'pending_approval', 
        label: 'Pending Staff Review', 
        variant: 'destructive' as const 
      };
    case 'approved':
      return { 
        status: 'approved', 
        label: 'Approved by Staff', 
        variant: 'default' as const 
      };
    case 'rejected':
      return { 
        status: 'rejected', 
        label: 'Changes Requested', 
        variant: 'secondary' as const 
      };
    case 'active':
      return { 
        status: 'active', 
        label: 'Active', 
        variant: 'default' as const 
      };
    default:
      return { 
        status: carePlan.status, 
        label: carePlan.status, 
        variant: 'secondary' as const 
      };
  }
};
