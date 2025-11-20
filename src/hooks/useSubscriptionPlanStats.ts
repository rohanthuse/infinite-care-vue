import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlanStats {
  total_plans: number;
  active_plans: number;
  inactive_plans: number;
  total_organizations: number;
}

export function useSubscriptionPlanStats() {
  return useQuery({
    queryKey: ['subscription-plan-stats'],
    queryFn: async () => {
      const [plansResult, orgsResult] = await Promise.all([
        supabase.from('subscription_plans').select('is_active', { count: 'exact' }),
        supabase.from('organizations').select('id', { count: 'exact' })
      ]);

      if (plansResult.error) throw plansResult.error;
      if (orgsResult.error) throw orgsResult.error;

      const activePlans = plansResult.data?.filter(p => p.is_active === true).length || 0;
      const inactivePlans = plansResult.data?.filter(p => p.is_active === false).length || 0;

      return {
        total_plans: plansResult.count || 0,
        active_plans: activePlans,
        inactive_plans: inactivePlans,
        total_organizations: orgsResult.count || 0,
      } as SubscriptionPlanStats;
    },
  });
}
