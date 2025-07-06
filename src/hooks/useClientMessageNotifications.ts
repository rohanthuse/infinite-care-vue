import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

export const useClientMessageNotifications = () => {
  const { data: currentUser } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser?.id) return;

    // Consolidated real-time subscription for all message-related updates
    const channel = supabase
      .channel('client-messaging-consolidated')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message update received:', payload);
          
          // Refresh message-related queries
          queryClient.invalidateQueries({ queryKey: ['client-threads'] });
          queryClient.invalidateQueries({ queryKey: ['client-thread-messages'] });
          queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
          
          // Handle new message notifications
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== currentUser.id) {
            handleNewMessage(payload.new, currentUser.id, queryClient);
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
        (payload) => {
          console.log('Thread update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['client-threads'] });
          queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          
          // Show toast for message notifications
          if (payload.new.type === 'message') {
            toast.info(payload.new.title, {
              description: payload.new.message,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = '/client-dashboard/messages';
                }
              },
              duration: 5000,
            });
          }

          // Refresh notifications
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    // Request notification permission on mount
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, queryClient]);
};

// Helper function to handle new message notifications
const handleNewMessage = async (message: any, currentUserId: string, queryClient: any) => {
  try {
    // Check if the message is in a thread where the current user is a participant
    const { data: participants } = await supabase
      .from('message_participants')
      .select('user_id')
      .eq('thread_id', message.thread_id)
      .eq('user_id', currentUserId);

    if (participants && participants.length > 0) {
      // Get sender name for notification
      const { data: senderInfo } = await supabase
        .from('message_participants')
        .select('user_name')
        .eq('thread_id', message.thread_id)
        .eq('user_id', message.sender_id)
        .single();

      const senderName = senderInfo?.user_name || 'Someone';
      
      // Show toast notification
      toast.success(`New message from ${senderName}`, {
        description: message.content?.length > 50 
          ? message.content.substring(0, 50) + '...' 
          : message.content,
        action: {
          label: 'View',
          onClick: () => {
            window.location.href = '/client-dashboard/messages';
          }
        },
        duration: 5000,
      });

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(`New message from ${senderName}`, {
          body: message.content?.length > 100 
            ? message.content.substring(0, 100) + '...' 
            : message.content,
          icon: '/favicon.ico',
          tag: 'message-notification'
        });
      }

      // Show prominent pulse indicator
      const pulseIndicator = document.getElementById('message-pulse-indicator');
      if (pulseIndicator) {
        pulseIndicator.style.display = 'block';
        setTimeout(() => {
          pulseIndicator.style.display = 'none';
        }, 10000);
      }
    }
  } catch (error) {
    console.error('Error handling new message notification:', error);
  }
};