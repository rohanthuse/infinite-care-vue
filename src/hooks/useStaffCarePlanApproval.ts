/**
 * @deprecated Staff approval workflow has been removed.
 * Care plans now go directly to client approval.
 * This file is kept for backward compatibility but should not be used in new code.
 */

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

/**
 * @deprecated This function is no longer used. Care plans skip staff approval.
 */
const staffApproveCarePlan = async ({ carePlanId, comments }: StaffApproveCarePlanData) => {
  console.warn('[staffApproveCarePlan] DEPRECATED: Staff approval workflow has been removed');
  throw new Error('Staff approval workflow has been removed. Care plans go directly to client approval.');
};

/**
 * @deprecated This function is no longer used. Care plans skip staff approval.
 */
const staffRejectCarePlan = async ({ carePlanId, comments, reason }: StaffRejectCarePlanData) => {
  console.warn('[staffRejectCarePlan] DEPRECATED: Staff approval workflow has been removed');
  throw new Error('Staff approval workflow has been removed.');
};

/**
 * @deprecated This hook is no longer used. Care plans skip staff approval.
 */
export const useStaffApproveCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffApproveCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      queryClient.invalidateQueries({ queryKey: ['carer-assigned-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      toast.error('Staff approval workflow has been removed. Care plans go directly to client approval.');
    },
    onError: (error: any) => {
      console.error('Failed to approve care plan:', error);
      toast.error('Staff approval workflow has been removed.');
    },
  });
};

/**
 * @deprecated This hook is no longer used. Care plans skip staff approval.
 */
export const useStaffRejectCarePlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: staffRejectCarePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      toast.error('Staff approval workflow has been removed.');
    },
    onError: (error: any) => {
      console.error('Failed to reject care plan:', error);
      toast.error('Staff approval workflow has been removed.');
    },
  });
};

/**
 * @deprecated Hook to get care plan status info for staff - no longer relevant
 */
export const useStaffCarePlanStatus = (carePlan: any) => {
  if (!carePlan) return { status: 'unknown', label: 'Unknown', variant: 'secondary' as const };

  switch (carePlan.status) {
    case 'draft':
      return { 
        status: 'draft', 
        label: 'Draft', 
        variant: 'secondary' as const 
      };
    case 'pending_client_approval':
      return { 
        status: 'pending_client_approval', 
        label: 'Pending Client Review', 
        variant: 'outline' as const 
      };
    case 'active':
      return { 
        status: 'active', 
        label: 'Active', 
        variant: 'default' as const 
      };
    case 'rejected':
      return { 
        status: 'rejected', 
        label: 'Changes Requested', 
        variant: 'secondary' as const 
      };
    default:
      return { 
        status: carePlan.status, 
        label: carePlan.status, 
        variant: 'secondary' as const 
      };
  }
};
