
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { syncCarePlanToClientProfile } from '@/utils/syncCarePlanToClientProfile';

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

  // First, get the care plan to retrieve client_id for syncing
  const { data: carePlanData, error: fetchError } = await supabase
    .from('client_care_plans')
    .select('client_id')
    .eq('id', carePlanId)
    .single();

  if (fetchError) {
    console.error('Error fetching care plan:', fetchError);
    throw fetchError;
  }

  // Update care plan status to active (final approval) with client acknowledgment data
  const { error: updateError } = await supabase
    .from('client_care_plans')
    .update({
      status: 'active',
      client_acknowledged_at: new Date().toISOString(),
      client_signature_data: signatureData,
      client_comments: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId)
    .eq('status', 'pending_client_approval'); // Only allow approval if in correct status

  if (updateError) {
    console.error('Error approving care plan:', updateError);
    throw updateError;
  }

  // Sync care plan data to client profile
  if (carePlanData?.client_id) {
    try {
      console.log('[clientApproveCarePlan] Syncing care plan data to client profile');
      const syncResult = await syncCarePlanToClientProfile(carePlanId, carePlanData.client_id);
      if (!syncResult.success) {
        console.error('[clientApproveCarePlan] Error syncing to client profile:', syncResult.error);
        // Don't fail the approval for sync errors
      } else {
        console.log('[clientApproveCarePlan] Successfully synced care plan data to client profile');
      }
    } catch (syncError) {
      console.error('[clientApproveCarePlan] Error during client profile sync:', syncError);
      // Don't fail the approval for sync errors
    }
  }

  // Database triggers will handle all notifications automatically
  console.log(`[clientApproveCarePlan] Successfully approved care plan ${carePlanId}`);
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
      client_comments: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId)
    .eq('status', 'pending_client_approval'); // Only allow rejection if in correct status

  if (updateError) {
    console.error('Error rejecting care plan:', updateError);
    throw updateError;
  }

  // Database triggers will handle all notifications automatically
  console.log(`[clientRejectCarePlan] Successfully rejected care plan ${carePlanId}`);
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
      } else if (error.message?.includes('assigned_staff_id')) {
        errorMessage = 'System error occurred. Please try again or contact support.';
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
      } else if (error.message?.includes('assigned_staff_id')) {
        errorMessage = 'System error occurred. Please try again or contact support.';
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
