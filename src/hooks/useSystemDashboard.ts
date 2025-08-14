import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSystemUserStats } from '@/hooks/useSystemUsers';

export interface SystemStatsData {
  totalTenants: number;
  totalUsers: number;
  systemUptime: string;
  databaseHealth: string;
  activeConnections: number;
  securityScore: string;
}

export const useSystemDashboard = () => {
  const tenantsSummary = useQuery({
    queryKey: ['system-tenants-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('list-system-tenants');
      if (error) throw error;
      const tenants = Array.isArray(data) ? data : data?.tenants || [];
      const totalTenants = tenants.length;
      const activeUsers = tenants.reduce(
        (sum: number, t: any) => sum + (t.activeUsers ?? 0),
        0
      );
      return { totalTenants, activeUsers } as { totalTenants: number; activeUsers: number };
    },
  });

  const userStats = useSystemUserStats();

  const isLoading = tenantsSummary.isLoading || userStats.isLoading;
  const systemStats: SystemStatsData = {
    totalTenants: tenantsSummary.data?.totalTenants ?? 0,
    totalUsers: (userStats.data as any)?.total ?? 0,
    systemUptime: 'Operational',
    databaseHealth: 'Good',
    activeConnections: tenantsSummary.data?.activeUsers ?? 0,
    securityScore: 'A+',
  };

  return {
    systemStats,
    isLoading,
    error: (tenantsSummary.error as any) || (userStats.error as any) || null,
  };
};
