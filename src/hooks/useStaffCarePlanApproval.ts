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
  reason?: string;
}

// Staff approve care plan
const staffApproveCarePlan = async ({ carePlanId, comments }: StaffApproveCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update care plan with staff approval
  const { error } = await supabase
    .from('client_care_plans')
    .update({
      status: 'pending_approval',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: comments || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId);

  if (error) {
    console.error('Error approving care plan:', error);
    throw error;
  }

  return { success: true };
};

// Staff reject care plan (send back to draft)
const staffRejectCarePlan = async ({ carePlanId, comments, reason }: StaffRejectCarePlanData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Update care plan status back to draft with rejection reason
  const { error } = await supabase
    .from('client_care_plans')
    .update({
      status: 'draft',
      rejection_reason: reason || comments,
      notes: comments,
      updated_at: new Date().toISOString(),
    })
    .eq('id', carePlanId);

  if (error) {
    console.error('Error rejecting care plan:', error);
    throw error;
  }

  return { success: true };
};

export const useStaffApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApproveCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      toast.success('Care plan approved and sent to client for signature.');
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
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      toast.success('Care plan returned to draft status with feedback.');
    },
    onError: (error) => {
      console.error('Failed to reject care plan:', error);
      toast.error('Failed to reject care plan. Please try again.');
    },
  });
};

// Hook to check if care plan needs staff approval
export const useCarePlanRequiresStaffApproval = (carePlan: any) => {
  if (!carePlan) return false;
  
  return carePlan.status === 'draft' && !carePlan.approved_by;
};

// Hook to get staff care plan status info
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
        label: 'Pending Client Signature', 
        variant: 'secondary' as const 
      };
    case 'approved':
      return { 
        status: 'approved', 
        label: 'Client Approved', 
        variant: 'default' as const 
      };
    case 'rejected':
      return { 
        status: 'rejected', 
        label: 'Client Requested Changes', 
        variant: 'destructive' as const 
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