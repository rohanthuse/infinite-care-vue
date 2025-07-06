import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUserRole } from './useUserRole';

export const useClientMessageNotifications = () => {
  const { data: currentUser } = useUserRole();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!currentUser) return;

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('client-message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=neq.${currentUser.id}` // Only listen to messages not sent by current user
        },
        (payload) => {
          console.log('New message received:', payload);
          
          // Check if the message is in a thread where the current user is a participant
          const checkParticipation = async () => {
            const { data: participants } = await supabase
              .from('message_participants')
              .select('user_id')
              .eq('thread_id', payload.new.thread_id)
              .eq('user_id', currentUser.id);

            if (participants && participants.length > 0) {
              // Get sender name for notification
              const { data: senderInfo } = await supabase
                .from('message_participants')
                .select('user_name')
                .eq('thread_id', payload.new.thread_id)
                .eq('user_id', payload.new.sender_id)
                .single();

              const senderName = senderInfo?.user_name || 'Someone';
              
              // Show toast notification
              toast.success(`New message from ${senderName}`, {
                description: payload.new.content?.length > 50 
                  ? payload.new.content.substring(0, 50) + '...' 
                  : payload.new.content,
                action: {
                  label: 'View',
                  onClick: () => {
                    // Navigate to messages page
                    window.location.href = '/client-dashboard/messages';
                  }
                },
                duration: 5000,
              });

              // Show browser notification if permission granted
              if (Notification.permission === 'granted') {
                new Notification(`New message from ${senderName}`, {
                  body: payload.new.content?.length > 100 
                    ? payload.new.content.substring(0, 100) + '...' 
                    : payload.new.content,
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
                }, 10000); // Hide after 10 seconds
              }

              // Invalidate queries to refresh message lists
              queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
              queryClient.invalidateQueries({ queryKey: ['client-thread-messages'] });
              queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
          };

          checkParticipation();
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

          // Invalidate notifications query
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