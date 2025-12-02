import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSystemAuth } from "@/contexts/SystemAuthContext";

export interface SystemNotification {
  id: string;
  user_id: string;
  type: string;
  category: 'info' | 'warning' | 'error' | 'success';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  data?: any;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Hook for managing system-level notifications (for system dashboard users)
 * Filters notifications for the authenticated system user
 */
export const useSystemNotifications = () => {
  const queryClient = useQueryClient();
  const { user: systemUser } = useSystemAuth();

  // Fetch notifications for the current system user
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['system-notifications', systemUser?.id],
    queryFn: async () => {
      try {
        if (!systemUser?.id) {
          console.warn('No system user authenticated for notifications');
          return [];
        }

        // Use the RPC function to fetch notifications for this system user
        const { data, error } = await supabase
          .rpc('get_system_notifications', { 
            p_user_id: systemUser.id 
          });

        if (error) {
          console.error('Error fetching system notifications:', error);
          return [];
        }

        return data as SystemNotification[];
      } catch (error) {
        console.error('Unexpected error fetching system notifications:', error);
        return [];
      }
    },
    enabled: !!systemUser?.id,
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

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
      queryClient.invalidateQueries({ queryKey: ['system-notifications', systemUser?.id] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!systemUser?.id) throw new Error('Not authenticated');

      // Get all unread notification IDs for this user
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', systemUser?.id] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
  };
};
