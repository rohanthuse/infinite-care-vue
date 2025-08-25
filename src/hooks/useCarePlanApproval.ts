import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ApproveCarePlanData {
  carePlanId: string;
  signatureData: string;
  comments?: string;
}

interface RejectCarePlanData {
  carePlanId: string;
  comments: string;
}

interface RequestChangesData {
  carePlanId: string;
  comments: string;
}

// Helper function to ensure client auth link
const ensureClientAuthLink = async (user: any) => {
  // Check if client exists and has auth_user_id linked
  const { data: clientCheck } = await supabase
    .from('clients')
    .select('id, auth_user_id, email')
    .eq('email', user.email)
    .single();

  if (!clientCheck) {
    throw new Error('Client profile not found. Please contact support.');
  }

  // If auth_user_id is not linked, update it
  if (!clientCheck.auth_user_id || clientCheck.auth_user_id !== user.id) {
    console.log('Linking client auth user ID:', user.id);
    const { error: linkError } = await supabase
      .from('clients')
      .update({ auth_user_id: user.id })
      .eq('id', clientCheck.id);

    if (linkError) {
      console.error('Failed to link client auth:', linkError);
      throw new Error('Failed to establish client authentication link');
    }
  }

  return clientCheck.id;
};

// Approve care plan
const approveCarePlan = async ({ carePlanId, signatureData, comments }: ApproveCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[approveCarePlan] Starting approval process for care plan ${carePlanId} by user ${user.id}`);

  try {
    // Ensure client auth link is established
    const clientId = await ensureClientAuthLink(user);
    console.log(`[approveCarePlan] Client auth link confirmed for client ${clientId}`);

    const clientIp = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => null);

    // Update care plan with client acknowledgment and activate it
    const { error } = await supabase
      .from('client_care_plans')
      .update({
        status: 'active',
        client_acknowledged_at: new Date().toISOString(),
        client_signature_data: signatureData,
        client_acknowledgment_ip: clientIp,
        acknowledgment_method: 'digital_signature',
        client_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carePlanId)
      .eq('status', 'pending_client_approval'); // Only allow approval from pending_client_approval status

    if (error) {
      console.error('[approveCarePlan] Error updating care plan:', error);
      throw error;
    }

    // Create status history entry
    await supabase
      .from('care_plan_status_history')
      .insert({
        care_plan_id: carePlanId,
        previous_status: 'pending_client_approval',
        new_status: 'active',
        changed_by: user.id,
        changed_by_type: 'client',
        client_comments: comments
      });

    console.log(`[approveCarePlan] Successfully approved care plan ${carePlanId}`);
    return { success: true };
  } catch (error) {
    console.error('[approveCarePlan] Failed:', error);
    throw error;
  }
};

// Reject care plan (request changes)
const rejectCarePlan = async ({ carePlanId, comments }: RejectCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[rejectCarePlan] Starting rejection process for care plan ${carePlanId} by user ${user.id}`);

  try {
    // Ensure client auth link is established
    const clientId = await ensureClientAuthLink(user);
    console.log(`[rejectCarePlan] Client auth link confirmed for client ${clientId}`);

    // Update care plan status to rejected with comments
    const { error } = await supabase
      .from('client_care_plans')
      .update({
        status: 'rejected',
        client_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carePlanId);

    if (error) {
      console.error('[rejectCarePlan] Error updating care plan:', error);
      throw error;
    }

    // Create status history entry
    await supabase
      .from('care_plan_status_history')
      .insert({
        care_plan_id: carePlanId,
        previous_status: 'pending_client_approval',
        new_status: 'rejected',
        changed_by: user.id,
        changed_by_type: 'client',
        client_comments: comments,
        reason: 'Client requested changes'
      });

    console.log(`[rejectCarePlan] Successfully rejected care plan ${carePlanId}`);
    return { success: true };
  } catch (error) {
    console.error('[rejectCarePlan] Failed:', error);
    throw error;
  }
};

export const useApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.success('Care plan approved and activated successfully! Your care team has been notified.');
    },
    onError: (error: any) => {
      console.error('Failed to approve care plan:', error);
      
      let errorMessage = 'Failed to approve care plan. Please try again.';
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'You must be logged in to approve care plans.';
      } else if (error.message?.includes('Client profile not found')) {
        errorMessage = 'Client profile not found. Please contact support.';
      } else if (error.message?.includes('authentication link')) {
        errorMessage = 'Unable to verify client identity. Please contact support.';
      } else if (error.code === '23503') {
        errorMessage = 'Unable to approve: Care plan not found or already processed.';
      }
      
      toast.error(errorMessage);
    },
  });
};

export const useRejectCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.success('Change request submitted successfully! Your care team will review your comments.');
    },
    onError: (error: any) => {
      console.error('Failed to request changes:', error);
      
      let errorMessage = 'Failed to submit change request. Please try again.';
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'You must be logged in to request changes to care plans.';
      } else if (error.message?.includes('Client profile not found')) {
        errorMessage = 'Client profile not found. Please contact support.';
      } else if (error.message?.includes('authentication link')) {
        errorMessage = 'Unable to verify client identity. Please contact support.';
      }
      
      toast.error(errorMessage);
    },
  });
};

// Request changes for active care plan
const requestChanges = async ({ carePlanId, comments }: RequestChangesData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log(`[requestChanges] Starting change request for care plan ${carePlanId} by user ${user.id}`);

  try {
    // Ensure client auth link is established
    const clientId = await ensureClientAuthLink(user);
    console.log(`[requestChanges] Client auth link confirmed for client ${clientId}`);

    // Update care plan with change request
    const { error } = await supabase
      .from('client_care_plans')
      .update({
        changes_requested_at: new Date().toISOString(),
        changes_requested_by: user.id,
        change_request_comments: comments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', carePlanId);

    if (error) {
      console.error('[requestChanges] Error updating care plan:', error);
      throw error;
    }

    // Create status history entry
    await supabase
      .from('care_plan_status_history')
      .insert({
        care_plan_id: carePlanId,
        previous_status: 'active',
        new_status: 'active',
        changed_by: user.id,
        changed_by_type: 'client',
        client_comments: comments,
        reason: 'Client requested changes to active plan'
      });

    console.log(`[requestChanges] Successfully submitted change request for care plan ${carePlanId}`);
    return { success: true };
  } catch (error) {
    console.error('[requestChanges] Failed:', error);
    throw error;
  }
};

export const useRequestChanges = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestChanges,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.success('Change request submitted successfully! Your care team has been notified and will contact you soon.');
    },
    onError: (error: any) => {
      console.error('Failed to request changes:', error);
      
      let errorMessage = 'Failed to submit change request. Please try again.';
      
      if (error.message?.includes('not authenticated')) {
        errorMessage = 'You must be logged in to request changes.';
      } else if (error.message?.includes('Client profile not found')) {
        errorMessage = 'Client profile not found. Please contact support.';
      } else if (error.message?.includes('authentication link')) {
        errorMessage = 'Unable to verify client identity. Please contact support.';
      }
      
      toast.error(errorMessage);
    },
  });
};

// Hook to check if care plan needs client approval
export const useCarePlanRequiresApproval = (carePlan: any) => {
  if (!carePlan) return false;
  
  return carePlan.status === 'pending_client_approval' && !carePlan.client_acknowledged_at;
};

// Hook to check if changes have been requested
export const useCarePlanHasChangeRequest = (carePlan: any) => {
  if (!carePlan) return { hasRequest: false };
  
  return {
    hasRequest: !!carePlan.changes_requested_at,
    requestDate: carePlan.changes_requested_at,
    requestComments: carePlan.change_request_comments
  };
};

// Hook to get care plan status info
export const useCarePlanStatus = (carePlan: any) => {
  if (!carePlan) return { status: 'unknown', label: 'Unknown', variant: 'secondary' as const };

  const hasChangeRequest = !!carePlan.changes_requested_at;
  
  switch (carePlan.status) {
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
        label: hasChangeRequest ? 'Changes Requested' : 'Approved by You', 
        variant: hasChangeRequest ? 'secondary' as const : 'default' as const 
      };
    case 'active':
      return { 
        status: 'active', 
        label: hasChangeRequest ? 'Changes Requested' : 'Active Care Plan', 
        variant: hasChangeRequest ? 'secondary' as const : 'default' as const 
      };
    case 'rejected':
      return { 
        status: 'rejected', 
        label: 'Changes Requested', 
        variant: 'secondary' as const 
      };
    case 'draft':
      return { 
        status: 'draft', 
        label: 'Draft', 
        variant: 'outline' as const 
      };
    default:
      return { 
        status: carePlan.status, 
        label: carePlan.status, 
        variant: 'secondary' as const 
      };
  }
};