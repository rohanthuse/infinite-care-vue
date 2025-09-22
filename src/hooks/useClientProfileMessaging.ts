import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface ClientMessageThread {
  id: string;
  subject: string;
  participants: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    timestamp: Date;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  timestamp: Date;
  hasAttachments: boolean;
  attachments?: any[];
}

// Get message threads for a specific client
export const useClientMessageThreads = (clientId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['client-message-threads', clientId],
    queryFn: async (): Promise<ClientMessageThread[]> => {
      if (!clientId || !currentUser) return [];

      // First get the client's auth_user_id
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('auth_user_id')
        .eq('id', clientId)
        .single();

      if (clientError || !client?.auth_user_id) {
        console.error('Client not found or no auth_user_id:', clientError);
        return [];
      }

      // Get threads where this client is a participant
      const { data: participantThreads, error: participantError } = await supabase
        .from('message_participants')
        .select('thread_id')
        .eq('user_id', client.auth_user_id);

      if (participantError || !participantThreads?.length) {
        return [];
      }

      const threadIds = participantThreads.map(p => p.thread_id);

      // Get thread details
      const { data: threads, error: threadsError } = await supabase
        .from('message_threads')
        .select(`
          id,
          subject,
          created_at,
          updated_at,
          last_message_at,
          message_participants (
            user_id,
            user_type,
            user_name
          )
        `)
        .in('id', threadIds)
        .order('last_message_at', { ascending: false });

      if (threadsError) {
        console.error('Error fetching threads:', threadsError);
        return [];
      }

      if (!threads) return [];

      // Process threads
      const processedThreads = await Promise.all(
        threads.map(async (thread) => {
          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select(`
              id,
              sender_id,
              content,
              created_at
            `)
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages not read by current user if they're part of conversation)
          const { data: allMessages } = await supabase
            .from('messages')
            .select('id')
            .eq('thread_id', thread.id);

          const { data: readMessages } = await supabase
            .from('message_read_status')
            .select('message_id')
            .eq('user_id', currentUser.id)
            .in('message_id', allMessages?.map(m => m.id) || []);

          const unreadCount = (allMessages?.length || 0) - (readMessages?.length || 0);

          // Process participants
          const participants = thread.message_participants?.map(p => ({
            id: p.user_id,
            name: p.user_name || 'Unknown User',
            type: p.user_type || 'user'
          })) || [];

          // Get sender name for latest message
          let senderName = 'Unknown';
          if (latestMessage) {
            const sender = participants.find(p => p.id === latestMessage.sender_id);
            senderName = sender?.name || 'Unknown';
          }

          return {
            id: thread.id,
            subject: thread.subject,
            participants: participants.filter(p => p.id !== client.auth_user_id), // Exclude the client from participant list for display
            lastMessage: latestMessage ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderName,
              timestamp: new Date(latestMessage.created_at)
            } : undefined,
            unreadCount,
            createdAt: thread.created_at,
            updatedAt: thread.updated_at
          };
        })
      );

      return processedThreads;
    },
    enabled: !!clientId && !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Get messages for a specific thread
export const useClientThreadMessages = (threadId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['client-thread-messages', threadId],
    queryFn: async (): Promise<ClientMessage[]> => {
      if (!threadId || !currentUser) return [];

      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          thread_id,
          sender_id,
          sender_type,
          content,
          has_attachments,
          attachments,
          created_at
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread messages:', error);
        return [];
      }

      if (!messages) return [];

      // Get participant names
      const { data: participants } = await supabase
        .from('message_participants')
        .select('user_id, user_name')
        .eq('thread_id', threadId);

      return messages.map(message => {
        const participant = participants?.find(p => p.user_id === message.sender_id);
        
        return {
          id: message.id,
          threadId: message.thread_id,
          senderId: message.sender_id,
          senderName: participant?.user_name || 'Unknown',
          senderType: message.sender_type,
          content: message.content,
          timestamp: new Date(message.created_at),
          hasAttachments: message.has_attachments,
          attachments: (message.attachments as any[]) || []
        };
      });
    },
    enabled: !!threadId && !!currentUser,
  });
};

// Send message to client (from admin view)
export const useSendMessageToClient = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({
      threadId,
      content,
      attachments = []
    }: {
      threadId: string;
      content: string;
      attachments?: any[];
    }) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: currentUser.id,
          sender_type: currentUser.role,
          content,
          has_attachments: attachments.length > 0,
          attachments
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread's last_message_at
      await supabase
        .from('message_threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['client-thread-messages', data.thread_id] });
    }
  });
};