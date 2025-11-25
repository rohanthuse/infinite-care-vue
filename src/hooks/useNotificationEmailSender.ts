import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook to automatically send email notifications for high-priority notifications
 * Monitors the notifications table and triggers email sends via edge function
 */
export const useNotificationEmailSender = () => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const processedNotifications = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const sendEmailForNotification = async (notificationId: string) => {
      // Avoid duplicate processing
      if (processedNotifications.current.has(notificationId)) {
        return;
      }

      processedNotifications.current.add(notificationId);

      try {
        console.log('Triggering email for notification:', notificationId);
        
        const { data, error } = await supabase.functions.invoke('send-notification-email', {
          body: { notification_id: notificationId }
        });

        if (error) {
          console.error('Failed to send notification email:', error);
          // Remove from processed set to allow retry
          processedNotifications.current.delete(notificationId);
        } else {
          console.log('Email sent successfully:', data);
        }
      } catch (error) {
        console.error('Error invoking send-notification-email function:', error);
        // Remove from processed set to allow retry
        processedNotifications.current.delete(notificationId);
      }
    };

    // Subscribe to new high-priority notifications for the current user
    const channel = supabase
      .channel(`notification-emails-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New notification detected:', payload);
          
          const notification = payload.new as any;
          
          // Only send emails for high and urgent priority notifications
          if (notification.priority === 'high' || notification.priority === 'urgent') {
            // Check if email was already sent
            if (!notification.email_sent) {
              // Check if email notification was requested
              const notificationMethods = notification.data?.notification_methods || [];
              if (Array.isArray(notificationMethods) && notificationMethods.includes('email')) {
                await sendEmailForNotification(notification.id);
              } else {
                console.log('Email notification not requested, skipping email send for notification:', notification.id);
              }
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clear processed notifications on unmount
      processedNotifications.current.clear();
    };
  }, [user]);

  return null;
};
