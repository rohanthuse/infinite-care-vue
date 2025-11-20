import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  max_users: number | null;
  max_branches: number | null;
  price_monthly: number;
  price_yearly: number;
  features: any | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('max_users', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}

export function useActiveSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('max_users', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });
}
