import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      const { data: plan, error } = await supabase
        .from('subscription_plans')
        .insert({
          name: data.name,
          description: data.description || null,
          max_users: data.max_users,
          max_branches: data.max_branches || null,
          price_monthly: data.price_monthly,
          price_yearly: data.price_yearly,
          features: data.features || null,
          is_active: data.is_active,
        })
        .select()
        .single();

      if (error) throw error;
      return plan;
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
