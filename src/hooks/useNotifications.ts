
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export interface Notification {
  id: string;
  user_id: string;
  branch_id?: string;
  type: 'booking' | 'task' | 'appointment' | 'document' | 'system' | 'staff' | 'client' | 'medication' | 'rota';
  category: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
  high_priority_count: number;
  by_type: Record<string, { total: number; unread: number }>;
}

export const useNotifications = (branchId?: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);

  // Fetch notifications with real-time updates
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', branchId],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data as Notification[];
    },
  });

  // Get notification statistics
  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['notification-stats', branchId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_notification_stats', {
        p_user_id: user.id,
        p_branch_id: branchId || null,
      });

      if (error) {
        console.error('Error fetching notification stats:', error);
        throw error;
      }

      return data?.[0] as NotificationStats;
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  // Real-time subscription with proper cleanup
  useEffect(() => {
    // Create a unique channel name to avoid conflicts
    const channelName = `notifications-${branchId || 'global'}-${Date.now()}`;
    
    // Clean up any existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [queryClient, branchId]);

  return {
    notifications,
    stats,
    isLoading,
    statsLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};

// Hook to generate dynamic notification data from system state
export const useDynamicNotificationData = (branchId?: string) => {
  return useQuery({
    queryKey: ['dynamic-notification-data', branchId],
    queryFn: async () => {
      const now = new Date();
      const results: Record<string, number> = {};

      try {
        // Count overdue bookings for staff notifications
        const { count: overdueBookings } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .lt('end_time', now.toISOString())
          .neq('status', 'completed')
          .eq('branch_id', branchId || '');

        results.staff = overdueBookings || 0;

        // Count pending client requests/appointments
        const { count: pendingAppointments } = await supabase
          .from('client_appointments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        results.client = pendingAppointments || 0;

        // Count upcoming medication schedules (next 24 hours)
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const { count: medicationAlerts } = await supabase
          .from('client_medications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .gte('start_date', now.toISOString().split('T')[0])
          .lte('start_date', tomorrow.toISOString().split('T')[0]);

        results.medication = medicationAlerts || 0;

        // Count schedule conflicts (overlapping bookings)
        const { data: bookingConflicts } = await supabase
          .from('bookings')
          .select('staff_id, start_time, end_time')
          .eq('branch_id', branchId || '')
          .gte('start_time', now.toISOString());

        // Simple conflict detection
        let conflicts = 0;
        if (bookingConflicts) {
          for (let i = 0; i < bookingConflicts.length; i++) {
            for (let j = i + 1; j < bookingConflicts.length; j++) {
              const booking1 = bookingConflicts[i];
              const booking2 = bookingConflicts[j];
              if (booking1.staff_id === booking2.staff_id) {
                const start1 = new Date(booking1.start_time);
                const end1 = new Date(booking1.end_time);
                const start2 = new Date(booking2.start_time);
                const end2 = new Date(booking2.end_time);
                if (start1 < end2 && start2 < end1) {
                  conflicts++;
                }
              }
            }
          }
        }
        results.rota = conflicts;

        // Count recent reports
        const { count: recentReports } = await supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('branch_id', branchId || '')
          .eq('category', 'report')
          .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

        results.reports = recentReports || 0;

        return results;
      } catch (error) {
        console.error('Error fetching dynamic notification data:', error);
        return {
          staff: 0,
          client: 0,
          medication: 0,
          rota: 0,
          reports: 0,
        };
      }
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
