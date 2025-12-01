import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemAnalyticsData {
  total_tenants: number;
  total_users: number;
  monthly_revenue: number;
  yearly_revenue: number;
  monthly_count: number;
  yearly_count: number;
  total_revenue: number;
  demo_requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  recent_activity_count: number;
  subscription_distribution: Array<{
    plan_name: string;
    tenant_count: number;
    plan_id: string;
  }>;
  tenant_growth: Array<{
    month: string;
    month_date: string;
    count: number;
  }>;
}

export function useSystemAnalytics() {
  return useQuery({
    queryKey: ['system-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_system_analytics');
      
      if (error) throw error;
      
      return data as unknown as SystemAnalyticsData;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}
