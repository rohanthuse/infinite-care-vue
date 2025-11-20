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

      // Attempt deletion with count to verify success
      const { error, count } = await supabase
        .from('subscription_plans')
        .delete({ count: 'exact' })
        .eq('id', planId);

      if (error) {
        // Check for RLS permission error
        if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Permission denied: You must be logged in as a system administrator to delete subscription plans');
        }
        throw error;
      }

      // Verify the deletion actually happened
      if (count === 0) {
        throw new Error('Failed to delete plan: Permission denied or plan not found. Please ensure you are logged in as a system administrator.');
      }
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
