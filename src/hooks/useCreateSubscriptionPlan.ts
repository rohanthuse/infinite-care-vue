import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getSystemSessionToken } from '@/utils/systemSession';

interface CreateSubscriptionPlanData {
  name: string;
  description?: string;
  max_users: number;
  max_branches?: number;
  price_monthly: number;
  price_yearly: number;
  features?: any;
  is_active: boolean;
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionPlanData) => {
      const sessionToken = getSystemSessionToken();
      if (!sessionToken) {
        throw new Error('No system session found. Please log in again.');
      }

      const { data: planId, error } = await supabase.rpc('create_subscription_plan_as_admin', {
        p_session_token: sessionToken,
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
      return planId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-plan-stats'] });
      toast.success('Subscription plan created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating subscription plan:', error);
      toast.error('Failed to create subscription plan');
    },
  });
}
