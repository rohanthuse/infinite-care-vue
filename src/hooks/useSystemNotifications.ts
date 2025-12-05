import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSystemAuth } from "@/contexts/SystemAuthContext";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
 * Demo request notifications are broadcast to ALL system admins
 */
export const useSystemNotifications = () => {
  const queryClient = useQueryClient();
  const { user: systemUser } = useSystemAuth();
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Set up real-time subscription for demo_requests table
  useEffect(() => {
    if (!systemUser?.id) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Create a unique channel name to avoid subscription conflicts
    const channelName = `demo-request-notifications-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'demo_requests'
        },
        () => {
          // Refetch notifications when new demo request comes in - use consistent query key
          queryClient.invalidateQueries({ queryKey: ['system-notifications', systemUser?.id] });
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
  }, [queryClient, systemUser?.id]);

  // Fetch notifications for the current system user
  const {
    data: rawNotifications = [],
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

  // Deduplicate demo_request notifications by demo_request_id to avoid showing duplicates
  const notifications = useMemo(() => {
    const seenDemoRequestIds = new Set<string>();
    return rawNotifications.filter(n => {
      if (n.type === 'demo_request' && n.data?.demo_request_id) {
        if (seenDemoRequestIds.has(n.data.demo_request_id)) {
          return false;
        }
        seenDemoRequestIds.add(n.data.demo_request_id);
      }
      return true;
    });
  }, [rawNotifications]);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read_at).length;

  // Mark notification as read - with optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const sessionToken = localStorage.getItem('system_session_token');
      
      const { data, error } = await supabase
        .rpc('mark_system_notifications_read', { 
          p_notification_ids: [notificationId],
          p_session_token: sessionToken
        });

      if (error) throw error;
      const result = data as { success: boolean; error?: string; updated_count?: number } | null;
      if (!result?.success) throw new Error(result?.error || 'Failed to mark as read');
      return result;
    },
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['system-notifications', systemUser?.id] });
      
      // Snapshot previous value
      const previousNotifications = queryClient.getQueryData<SystemNotification[]>(['system-notifications', systemUser?.id]);
      
      // Optimistically update
      queryClient.setQueryData<SystemNotification[]>(['system-notifications', systemUser?.id], (old = []) =>
        old.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n)
      );
      
      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['system-notifications', systemUser?.id], context.previousNotifications);
      }
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', systemUser?.id] });
    },
  });

  // Mark all as read - with optimistic update
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter(n => !n.read_at).map(n => n.id);
      if (unreadIds.length === 0) return { success: true, updated_count: 0 };
      
      const sessionToken = localStorage.getItem('system_session_token');
      
      const { data, error } = await supabase
        .rpc('mark_system_notifications_read', { 
          p_notification_ids: unreadIds,
          p_session_token: sessionToken
        });

      if (error) throw error;
      const result = data as { success: boolean; error?: string; updated_count?: number } | null;
      if (!result?.success) throw new Error(result?.error || 'Failed to mark all as read');
      return result;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['system-notifications', systemUser?.id] });
      
      const previousNotifications = queryClient.getQueryData<SystemNotification[]>(['system-notifications', systemUser?.id]);
      
      // Optimistically mark all as read
      queryClient.setQueryData<SystemNotification[]>(['system-notifications', systemUser?.id], (old = []) =>
        old.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      );
      
      return { previousNotifications };
    },
    onError: (_err, _, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['system-notifications', systemUser?.id], context.previousNotifications);
      }
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['system-notifications', systemUser?.id] });
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
