
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useCarerMessageNotifications = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up real-time subscription for messages
    const channel = supabase
      .channel('carer-message-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('[CarerMessageNotifications] Message change:', payload);
          
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['unified-threads'] });
          queryClient.invalidateQueries({ queryKey: ['unified-thread-messages'] });
          
          // Handle new message notifications
          if (payload.eventType === 'INSERT') {
            await handleNewMessage(payload.new as any);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['unified-threads'] });
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleNewMessage = async (message: any) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if current user is a participant in this thread
      const { data: participants } = await supabase
        .from('message_participants')
        .select('user_id')
        .eq('thread_id', message.thread_id);

      const isParticipant = participants?.some(p => p.user_id === user.id);
      if (!isParticipant) return;

      // Don't notify for own messages
      if (message.sender_id === user.id) return;

      // Get sender info
      const { data: senderRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', message.sender_id)
        .single();

      let senderName = 'Someone';

      // Try to get sender name based on role
      if (senderRole?.role === 'client') {
        const { data: client } = await supabase
          .from('clients')
          .select('first_name, last_name')
          .eq('auth_user_id', message.sender_id)
          .single();
        if (client) {
          senderName = `${client.first_name} ${client.last_name}`;
        }
      } else if (senderRole?.role === 'super_admin' || senderRole?.role === 'branch_admin') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', message.sender_id)
          .single();
        if (profile) {
          senderName = `${profile.first_name} ${profile.last_name}`;
        }
      }

      // Show toast notification
      toast.success(`New message from ${senderName}`, {
        description: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
        duration: 5000,
      });

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`New message from ${senderName}`, {
          body: message.content?.substring(0, 100) + (message.content?.length > 100 ? '...' : ''),
          icon: '/favicon.ico',
          tag: 'carer-message',
        });
      }

    } catch (error) {
      console.error('[CarerMessageNotifications] Error handling new message:', error);
    }
  };
};
