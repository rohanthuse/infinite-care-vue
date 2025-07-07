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

  // Update care plan with client acknowledgment
  const { error } = await supabase
    .from('client_care_plans')
    .update({
      status: 'approved',
      client_acknowledged_at: new Date().toISOString(),
      client_signature_data: signatureData,
      client_acknowledgment_ip: clientIp,
      acknowledgment_method: 'digital_signature',
      client_comments: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId);

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
      toast.success('Care plan approved successfully! Your care team has been notified.');
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

// Hook to check if care plan needs client approval
export const useCarePlanRequiresApproval = (carePlan: any) => {
  if (!carePlan) return false;
  
  return carePlan.status === 'pending_approval' && !carePlan.client_acknowledged_at;
};

// Hook to get care plan status info
export const useCarePlanStatus = (carePlan: any) => {
  if (!carePlan) return { status: 'unknown', label: 'Unknown', variant: 'secondary' as const };

  switch (carePlan.status) {
    case 'pending_approval':
      return { 
        status: 'pending_approval', 
        label: 'Awaiting Your Approval', 
        variant: 'destructive' as const 
      };
    case 'approved':
      return { 
        status: 'approved', 
        label: 'Approved by You', 
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