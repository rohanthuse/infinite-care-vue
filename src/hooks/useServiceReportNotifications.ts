import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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
        (payload) => {
          const newReport = payload.new as any;
          const oldReport = payload.old as any;

          // Check if status changed
          if (newReport.status !== oldReport.status) {
            let message = '';
            let title = '';
            
            switch (newReport.status) {
              case 'approved':
                title = 'Service Report Approved';
                message = `Your service report has been approved${newReport.visible_to_client ? ' and shared with the client' : ''}`;
                toast.success(title, { description: message });
                break;
              case 'rejected':
                title = 'Service Report Rejected';
                message = 'Your service report has been rejected. Please review admin feedback.';
                toast.error(title, { description: message });
                break;
              case 'requires_revision':
                title = 'Service Report Needs Revision';
                message = 'Please review and update your service report based on admin feedback.';
                toast.warning(title, { description: message });
                break;
            }

            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
          }
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
        pending: data.filter(r => r.status === 'pending').length,
        approved: data.filter(r => r.status === 'approved').length,
        rejected: data.filter(r => r.status === 'rejected').length,
        requiresRevision: data.filter(r => r.status === 'requires_revision').length,
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