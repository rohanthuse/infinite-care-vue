import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffNotificationPreference {
  notification_type: string;
  enabled: boolean;
}

export interface StaffRecentMessage {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
  message_type?: string;
  thread_subject?: string;
}

export const useStaffCommunication = (staffId: string) => {
  // Fetch staff's auth_user_id first
  const { data: staff } = useQuery({
    queryKey: ['staff-auth', staffId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff')
        .select('id, auth_user_id, first_name, last_name')
        .eq('id', staffId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!staffId,
  });

  // Fetch notification preferences
  const { data: preferences, isLoading: prefsLoading } = useQuery({
    queryKey: ['staff-notification-preferences', staff?.auth_user_id],
    queryFn: async () => {
      if (!staff?.auth_user_id) return [];
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('notification_type, enabled')
        .eq('user_id', staff.auth_user_id);
      
      if (error) throw error;
      return data as StaffNotificationPreference[];
    },
    enabled: !!staff?.auth_user_id,
  });

  // Fetch recent messages where staff is a participant
  const { data: recentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['staff-recent-messages', staff?.auth_user_id],
    queryFn: async () => {
      if (!staff?.auth_user_id) return [];

      // Get thread IDs where staff is a participant
      const { data: participantData, error: participantError } = await supabase
        .from('message_participants')
        .select('thread_id')
        .eq('user_id', staff.auth_user_id);

      if (participantError || !participantData?.length) return [];

      const threadIds = participantData.map(p => p.thread_id);

      // Get recent messages from those threads
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          created_at,
          message_type,
          thread_id,
          message_threads!inner(subject)
        `)
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (messagesError) throw messagesError;

      // Get sender names
      const messagesWithSenders = await Promise.all(
        (messages || []).map(async (msg) => {
          const { data: participant } = await supabase
            .from('message_participants')
            .select('user_name')
            .eq('thread_id', msg.thread_id)
            .eq('user_id', msg.sender_id)
            .single();

          return {
            id: msg.id,
            content: msg.content,
            sender_name: participant?.user_name || 'Unknown',
            created_at: msg.created_at,
            message_type: msg.message_type,
            thread_subject: (msg.message_threads as any)?.subject
          };
        })
      );

      return messagesWithSenders as StaffRecentMessage[];
    },
    enabled: !!staff?.auth_user_id,
  });

  return {
    staff,
    preferences: preferences || [],
    recentMessages: recentMessages || [],
    isLoading: prefsLoading || messagesLoading,
  };
};
