import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      // Check if any organizations are using this plan
      const { data: orgs, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .eq('subscription_plan_id', planId)
        .limit(1);

      if (checkError) throw checkError;

      if (orgs && orgs.length > 0) {
        throw new Error('Cannot delete plan: organizations are currently using this plan');
      }

      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;
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
