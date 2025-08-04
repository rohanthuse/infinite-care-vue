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

// Approve care plan
const approveCarePlan = async ({ carePlanId, signatureData, comments }: ApproveCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

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
    console.error('Error approving care plan:', error);
    throw error;
  }

  return { success: true };
};

// Reject care plan (request changes)
const rejectCarePlan = async ({ carePlanId, comments }: RejectCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

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
    console.error('Error rejecting care plan:', error);
    throw error;
  }

  return { success: true };
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
    onError: (error) => {
      console.error('Failed to approve care plan:', error);
      toast.error('Failed to approve care plan. Please try again.');
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
    onError: (error) => {
      console.error('Failed to request changes:', error);
      toast.error('Failed to submit change request. Please try again.');
    },
  });
};

// Request changes for active care plan
const requestChanges = async ({ carePlanId, comments }: RequestChangesData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

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
    console.error('Error requesting changes:', error);
    throw error;
  }

  return { success: true };
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
    onError: (error) => {
      console.error('Failed to request changes:', error);
      toast.error('Failed to submit change request. Please try again.');
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
        label: 'Pending Staff Approval', 
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