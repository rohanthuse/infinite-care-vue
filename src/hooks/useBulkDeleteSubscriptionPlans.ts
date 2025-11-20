import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSystemSessionToken } from '@/utils/systemSession';

interface DeleteResult {
  successfulDeletes: string[];
  failedDeletes: Array<{ planId: string; error: string }>;
}

async function bulkDeleteSubscriptionPlans(planIds: string[]): Promise<DeleteResult> {
  const sessionToken = getSystemSessionToken();
  if (!sessionToken) {
    throw new Error('No system session found. Please log in again.');
  }

  const successfulDeletes: string[] = [];
  const failedDeletes: Array<{ planId: string; error: string }> = [];

  for (const planId of planIds) {
    try {
      const { error } = await supabase.rpc('delete_subscription_plan_as_admin', {
        p_session_token: sessionToken,
        p_plan_id: planId,
      });

      if (error) {
        failedDeletes.push({ planId, error: error.message });
      } else {
        successfulDeletes.push(planId);
      }
    } catch (err) {
      failedDeletes.push({
        planId,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return { successfulDeletes, failedDeletes };
}

export function useBulkDeleteSubscriptionPlans() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteSubscriptionPlans,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-stats'] });

      const { successfulDeletes, failedDeletes } = result;
      const totalAttempted = successfulDeletes.length + failedDeletes.length;

      if (successfulDeletes.length === totalAttempted) {
        toast.success(`Successfully deleted ${successfulDeletes.length} subscription plan${successfulDeletes.length > 1 ? 's' : ''}`);
      } else if (successfulDeletes.length === 0) {
        toast.error(`Failed to delete subscription plans. ${failedDeletes[0]?.error || 'Unknown error'}`);
      } else {
        toast.warning(
          `Partially completed: ${successfulDeletes.length} deleted, ${failedDeletes.length} failed. Some plans may be in use.`
        );
      }
    },
    onError: (error: Error) => {
      console.error('Error during bulk delete:', error);
      toast.error(error.message || 'Failed to delete subscription plans');
    },
  });
}
