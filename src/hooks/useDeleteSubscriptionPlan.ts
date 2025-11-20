import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSystemSessionToken } from '@/utils/systemSession';

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const sessionToken = getSystemSessionToken();
      if (!sessionToken) {
        throw new Error('No system session found. Please log in again.');
      }

      const { data, error } = await supabase.rpc('delete_subscription_plan_as_admin', {
        p_session_token: sessionToken,
        p_plan_id: planId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-stats'] });
      toast.success('Subscription plan deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting subscription plan:', error);
      toast.error(error.message || 'Failed to delete subscription plan');
    },
  });
}
