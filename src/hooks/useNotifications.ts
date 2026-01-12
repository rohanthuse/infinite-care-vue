
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { debounce } from "lodash";

export interface Notification {
  id: string;
  user_id: string;
  branch_id?: string;
  type: 'booking' | 'task' | 'appointment' | 'document' | 'system' | 'staff' | 'client' | 'medication' | 'rota' | 'message' | 'demo_request';
  category: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  archived_at?: string;
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

export const useNotifications = (branchId?: string, organizationId?: string) => {
  const queryClient = useQueryClient();
  const channelRef = useRef<any>(null);
  const failureCountRef = useRef(0);
  const lastInvalidationRef = useRef(0);
  const isDisabledRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch notifications with comprehensive error handling
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notifications', branchId, organizationId],
    queryFn: async () => {
      try {
        // Get current user first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user for notifications');
          return [];
        }

        let query = supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id) // Filter by current user
          .is('archived_at', null) // Exclude archived notifications
          .order('created_at', { ascending: false })
          .limit(50);

        if (branchId) {
          // Branch-specific: show ONLY this branch's notifications
          query = query.eq('branch_id', branchId);
        } else if (organizationId) {
          // Organization-level: show notifications for the organization
          // These are notifications where organization_id matches AND branch_id is null
          query = query
            .eq('organization_id', organizationId)
            .is('branch_id', null);
        }
        // If neither branchId nor organizationId, show all user notifications (fallback)

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching notifications:', error);
          // Return empty array instead of throwing to prevent blank screen
          return [];
        }

        return data as Notification[];
      } catch (error) {
        console.error('Unexpected error fetching notifications:', error);
        return [];
      }
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: 30000, // Poll every 30 seconds as fallback for real-time
  });

  // Get notification statistics with error handling
  const {
    data: stats,
    isLoading: statsLoading,
  } = useQuery({
    queryKey: ['notification-stats', branchId, organizationId],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No authenticated user for notification stats');
          return {
            total_count: 0,
            unread_count: 0,
            high_priority_count: 0,
            by_type: {}
          };
        }

        // For organization-level stats, we need to calculate manually
        // since the RPC doesn't support organization filtering
        if (organizationId && !branchId) {
          const { data: orgNotifications, error: orgError } = await supabase
            .from('notifications')
            .select('id, read_at, priority')
            .eq('user_id', user.id)
            .eq('organization_id', organizationId)
            .is('branch_id', null);

          if (orgError) {
            console.error('Error fetching org notification stats:', orgError);
            return {
              total_count: 0,
              unread_count: 0,
              high_priority_count: 0,
              by_type: {}
            };
          }

          const total_count = orgNotifications?.length || 0;
          const unread_count = orgNotifications?.filter(n => !n.read_at).length || 0;
          const high_priority_count = orgNotifications?.filter(n => n.priority === 'high' || n.priority === 'urgent').length || 0;

          return {
            total_count,
            unread_count,
            high_priority_count,
            by_type: {}
          };
        }

        const { data, error } = await supabase.rpc('get_notification_stats', {
          p_user_id: user.id,
          p_branch_id: branchId || null,
        });

        if (error) {
          console.error('Error fetching notification stats:', error);
          return {
            total_count: 0,
            unread_count: 0,
            high_priority_count: 0,
            by_type: {}
          };
        }

        return data?.[0] as NotificationStats || {
          total_count: 0,
          unread_count: 0,
          high_priority_count: 0,
          by_type: {}
        };
      } catch (error) {
        console.error('Unexpected error fetching notification stats:', error);
        return {
          total_count: 0,
          unread_count: 0,
          high_priority_count: 0,
          by_type: {}
        };
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Debounced query invalidation to prevent spam
  const debouncedInvalidateQueries = useMemo(
    () => debounce(() => {
      const now = Date.now();
      if (now - lastInvalidationRef.current < 1000) return; // Rate limit: max once per second
      
      lastInvalidationRef.current = now;
      try {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      } catch (error) {
        console.error('Error during query invalidation:', error);
      }
    }, 500),
    [queryClient]
  );

  // Mark notification as read with optimistic updates
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }
    },
    // Optimistic update for instant UI feedback
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications', branchId] });
      await queryClient.cancelQueries({ queryKey: ['notification-stats', branchId] });

      // Snapshot previous values for rollback
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', branchId]);
      const previousStats = queryClient.getQueryData<NotificationStats>(['notification-stats', branchId]);

      // Check if this notification is currently unread
      const notification = previousNotifications?.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;

      // Optimistically update notifications list
      queryClient.setQueryData<Notification[]>(['notifications', branchId], (old) =>
        old?.map(n => n.id === notificationId 
          ? { ...n, read_at: new Date().toISOString() } 
          : n
        ) || []
      );

      // Optimistically update stats (only decrement if was unread)
      if (wasUnread) {
        queryClient.setQueryData<NotificationStats>(['notification-stats', branchId], (old) => ({
          total_count: old?.total_count || 0,
          unread_count: Math.max(0, (old?.unread_count || 0) - 1),
          high_priority_count: old?.high_priority_count || 0,
          by_type: old?.by_type || {}
        }));
      }

      return { previousNotifications, previousStats };
    },
    onError: (error, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', branchId], context.previousNotifications);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['notification-stats', branchId], context.previousStats);
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after mutation settles to ensure consistency
      debouncedInvalidateQueries();
    },
  });

  // Archive notification with optimistic updates
  const archiveNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error archiving notification:', error);
        throw error;
      }
    },
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications', branchId] });
      await queryClient.cancelQueries({ queryKey: ['notification-stats', branchId] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications', branchId]);
      const previousStats = queryClient.getQueryData<NotificationStats>(['notification-stats', branchId]);

      // Optimistically remove the notification from the list
      queryClient.setQueryData<Notification[]>(['notifications', branchId], (old) =>
        old?.filter(n => n.id !== notificationId) || []
      );

      // Optimistically update stats
      const notification = previousNotifications?.find(n => n.id === notificationId);
      const wasUnread = notification && !notification.read_at;
      
      queryClient.setQueryData<NotificationStats>(['notification-stats', branchId], (old) => ({
        total_count: Math.max(0, (old?.total_count || 0) - 1),
        unread_count: wasUnread ? Math.max(0, (old?.unread_count || 0) - 1) : (old?.unread_count || 0),
        high_priority_count: old?.high_priority_count || 0,
        by_type: old?.by_type || {}
      }));

      return { previousNotifications, previousStats };
    },
    onError: (error, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', branchId], context.previousNotifications);
      }
      if (context?.previousStats) {
        queryClient.setQueryData(['notification-stats', branchId], context.previousStats);
      }
      toast({
        title: "Error",
        description: "Failed to archive notification",
        variant: "destructive",
      });
    },
    onSettled: () => {
      debouncedInvalidateQueries();
    },
  });

  // Mark all as read with error handling
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      try {
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
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
        throw error;
      }
    },
    onSuccess: () => {
      debouncedInvalidateQueries();
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  // Enhanced real-time subscription with more lenient circuit breaker
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    const maxRetries = 3; // Increased retries
    const maxFailures = 10; // More lenient emergency threshold
    
    const forceCleanup = () => {
      if (cleanupTimeoutRef.current) {
        clearTimeout(cleanupTimeoutRef.current);
      }
      if (channelRef.current) {
        try {
          console.log('Force cleaning up notification channel...');
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        } catch (error) {
          console.warn('Error during force cleanup:', error);
          channelRef.current = null; // Force null on error
        }
      }
    };

    const setupRealTimeSubscription = () => {
      try {
        // Emergency circuit breaker - disable if too many failures
        if (failureCountRef.current >= maxFailures || isDisabledRef.current) {
          console.warn(`Notification subscription disabled due to excessive failures (${failureCountRef.current}/${maxFailures}). Using polling only.`);
          return;
        }

        // Force cleanup first
        forceCleanup();

        // Create channel with timestamp to ensure uniqueness
        const channelName = `notifications-safe-${branchId || 'global'}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications'
            },
            (payload) => {
              console.log('Notification change received:', payload.eventType);
              // Reset failure count on successful message
              failureCountRef.current = 0;
              
              // Use debounced invalidation to prevent spam
              debouncedInvalidateQueries();
            }
          )
          .subscribe((status) => {
            console.log(`Notification subscription [${channelName}]:`, status);
            
            if (status === 'SUBSCRIBED') {
              failureCountRef.current = 0; // Reset on successful connection
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              failureCountRef.current++;
              console.error(`Notification subscription failed: ${status} (failure ${failureCountRef.current}/${maxFailures})`);
              
              // Emergency disable if too many failures
              if (failureCountRef.current >= maxFailures) {
                console.error('Emergency circuit breaker activated - disabling real-time notifications');
                isDisabledRef.current = true;
                forceCleanup();
                return;
              }
              
              // Limited retry with longer delays
              if (failureCountRef.current < maxRetries) {
                const delay = Math.min(2000 * Math.pow(2, failureCountRef.current), 30000);
                retryTimeout = setTimeout(() => {
                  console.log(`Retrying notification subscription in ${delay}ms...`);
                  setupRealTimeSubscription();
                }, delay);
              }
            }
          });

        channelRef.current = channel;
        
        // Safety cleanup after 5 minutes to prevent memory leaks
        cleanupTimeoutRef.current = setTimeout(() => {
          console.log('Safety cleanup of notification subscription after 5 minutes');
          forceCleanup();
        }, 5 * 60 * 1000);
        
      } catch (error) {
        console.error('Critical error setting up real-time subscription:', error);
        failureCountRef.current++;
        forceCleanup();
      }
    };

    // Only setup if not disabled
    if (!isDisabledRef.current) {
      setupRealTimeSubscription();
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      forceCleanup();
    };
  }, [queryClient, branchId, debouncedInvalidateQueries]);

  return {
    notifications,
    stats,
    isLoading,
    statsLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    archiveNotification: archiveNotificationMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isArchiving: archiveNotificationMutation.isPending,
  };
};

// Hook to generate dynamic notification data with comprehensive error handling
export const useDynamicNotificationData = (branchId?: string) => {
  return useQuery({
    queryKey: ['dynamic-notification-data', branchId],
    queryFn: async () => {
      const now = new Date();
      const results: Record<string, number> = {
        staff: 0,
        client: 0,
        medication: 0,
        rota: 0,
        reports: 0,
      };

      try {
        // Count overdue bookings for staff notifications
        try {
          const { count: overdueBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .lt('end_time', now.toISOString())
            .neq('status', 'completed')
            .eq('branch_id', branchId || '');

          results.staff = overdueBookings || 0;
        } catch (error) {
          console.warn('Error counting overdue bookings:', error);
        }

        // Count pending client requests/appointments
        try {
          const { count: pendingAppointments } = await supabase
            .from('client_appointments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

          results.client = pendingAppointments || 0;
        } catch (error) {
          console.warn('Error counting pending appointments:', error);
        }

        // Count upcoming medication schedules (next 24 hours)
        try {
          const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const { count: medicationAlerts } = await supabase
            .from('client_medications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .gte('start_date', now.toISOString().split('T')[0])
            .lte('start_date', tomorrow.toISOString().split('T')[0]);

          results.medication = medicationAlerts || 0;
        } catch (error) {
          console.warn('Error counting medication alerts:', error);
        }

        // Count schedule conflicts (overlapping bookings)
        try {
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
        } catch (error) {
          console.warn('Error counting rota conflicts:', error);
        }

        // Count recent reports
        try {
          const { count: recentReports } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('branch_id', branchId || '')
            .eq('category', 'report')
            .gte('created_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());

          results.reports = recentReports || 0;
        } catch (error) {
          console.warn('Error counting recent reports:', error);
        }

        return results;
      } catch (error) {
        console.error('Error fetching dynamic notification data:', error);
        return results;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
