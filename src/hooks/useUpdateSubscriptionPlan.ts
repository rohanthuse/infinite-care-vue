import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSystemSessionToken } from '@/utils/systemSession';

interface UpdateSubscriptionPlanData {
  id: string;
  name: string;
  description?: string;
  max_users: number;
  max_branches?: number;
  price_monthly: number;
  price_yearly: number;
  features?: any;
  is_active: boolean;
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionPlanData) => {
      const sessionToken = getSystemSessionToken();
      if (!sessionToken) {
        throw new Error('No system session found. Please log in again.');
      }

      const { data: success, error } = await supabase.rpc('update_subscription_plan_as_admin', {
        p_session_token: sessionToken,
        p_plan_id: data.id,
        p_name: data.name,
        p_description: data.description || null,
        p_max_users: data.max_users,
        p_max_branches: data.max_branches || null,
        p_price_monthly: data.price_monthly,
        p_price_yearly: data.price_yearly,
        p_features: data.features || null,
        p_is_active: data.is_active,
      });

      if (error) throw error;
      return success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-stats'] });
      toast.success('Subscription plan updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating subscription plan:', error);
      toast.error('Failed to update subscription plan');
    },
  });
}
