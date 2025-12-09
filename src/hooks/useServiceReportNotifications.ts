import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Hook to listen for service report notifications
export const useServiceReportNotifications = (userId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('service-reports-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'client_service_reports',
          filter: `staff_id=eq.${userId}`,
        },
        () => {
          // Just invalidate the cache when a report is updated
          queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
};

// Hook to get service report statistics for dashboard
export const useServiceReportStats = (staffId?: string) => {
  return useQuery({
    queryKey: ['service-report-stats', staffId],
    queryFn: async () => {
      if (!staffId) throw new Error('Staff ID is required');

      const { data, error } = await supabase
        .from('client_service_reports')
        .select('status, created_at')
        .eq('staff_id', staffId);

      if (error) throw error;

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const stats = {
        total: data.length,
        approved: data.length, // All reports are now auto-approved
        thisMonth: data.filter(r => new Date(r.created_at) >= thisMonth).length,
        lastMonth: data.filter(r => {
          const created = new Date(r.created_at);
          return created >= lastMonth && created < thisMonth;
        }).length,
      };

      return stats;
    },
    enabled: Boolean(staffId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
