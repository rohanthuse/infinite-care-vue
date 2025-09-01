import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ClientApproveCarePlanData {
  carePlanId: string;
  signatureData: string;
  comments?: string;
}

interface ClientRejectCarePlanData {
  carePlanId: string;
  comments: string;
}

// Client approve care plan
const clientApproveCarePlan = async ({ carePlanId, signatureData, comments }: ClientApproveCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[clientApproveCarePlan] Approving care plan ${carePlanId} by client ${user.id}`);

  // Update care plan status to active (final approval)
  const { error: updateError } = await supabase
    .from('client_care_plans')
    .update({
      status: 'active',
      client_approved_at: new Date().toISOString(),
      client_signature: signatureData,
      client_approval_comments: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId)
    .eq('status', 'pending_client_approval'); // Only allow approval if in correct status

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
      comments: comments || 'Care plan approved by client',
      previous_status: 'pending_client_approval',
      new_status: 'active'
    });

  if (approvalError) {
    console.error('Error creating client approval record:', approvalError);
    // Don't fail the operation for this
  }

  return { success: true };
};

// Client reject care plan (request changes)
const clientRejectCarePlan = async ({ carePlanId, comments }: ClientRejectCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[clientRejectCarePlan] Rejecting care plan ${carePlanId} by client ${user.id}`);

  // Update care plan status to rejected (needs staff revision)
  const { error: updateError } = await supabase
    .from('client_care_plans')
    .update({
      status: 'rejected',
      rejection_reason: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId)
    .eq('status', 'pending_client_approval'); // Only allow rejection if in correct status

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
      previous_status: 'pending_client_approval',
      new_status: 'rejected'
    });

  if (approvalError) {
    console.error('Error creating client approval record:', approvalError);
    // Don't fail the operation for this
  }

  return { success: true };
};

export const useClientApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientApproveCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Care plan approved successfully! Your care plan is now active.');
    },
    onError: (error: any) => {
      console.error('Failed to approve care plan:', error);
      
      let errorMessage = 'Failed to approve care plan. Please try again.';
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'You must be logged in to approve care plans.';
      } else if (error.code === '23503') {
        errorMessage = 'Unable to approve: Care plan not found or already processed.';
      }
      
      toast.error(errorMessage);
    },
  });
};

export const useClientRejectCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clientRejectCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Change request submitted. Your care team will review and update the plan.');
    },
    onError: (error: any) => {
      console.error('Failed to reject care plan:', error);
      
      let errorMessage = 'Failed to submit change request. Please try again.';
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'You must be logged in to request changes to care plans.';
      }
      
      toast.error(errorMessage);
    },
  });
};

// Hook to get care plan status info for clients
export const useClientCarePlanStatus = (carePlan: any) => {
  if (!carePlan) return { status: 'unknown', label: 'Unknown', variant: 'secondary' as const };

  switch (carePlan.status) {
    case 'draft':
      return { 
        status: 'draft', 
        label: 'Under Review', 
        variant: 'secondary' as const 
      };
    case 'pending_approval':
      return { 
        status: 'pending_approval', 
        label: 'Under Staff Review', 
        variant: 'secondary' as const 
      };
    case 'pending_client_approval':
      return { 
        status: 'pending_client_approval', 
        label: 'Awaiting Your Approval', 
        variant: 'destructive' as const 
      };
    case 'approved':
      return { 
        status: 'approved', 
        label: 'Approved', 
        variant: 'default' as const 
      };
    case 'rejected':
      return { 
        status: 'rejected', 
        label: 'Changes Requested', 
        variant: 'outline' as const 
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