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
  adminOnly?: boolean;
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
  adminEyesOnly?: boolean;
}

// Get message threads for a specific client
export const useClientMessageThreads = (clientId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['client-message-threads', clientId],
    queryFn: async (): Promise<ClientMessageThread[]> => {
      if (!clientId || !currentUser) return [];

      // Check if current user is an admin
      const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'branch_admin';

      // First get the client's auth_user_id and basic info
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('auth_user_id, first_name, last_name, email')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('Client not found:', clientError);
        return [];
      }

      let threadIds: string[] = [];

      // Strategy 1: Try auth_user_id if available
      if (client?.auth_user_id) {
        const { data: participantThreads } = await supabase
          .from('message_participants')
          .select('thread_id')
          .eq('user_id', client.auth_user_id);

        if (participantThreads?.length) {
          threadIds = participantThreads.map(p => p.thread_id);
        }
      }

      // Strategy 2: Also search by client name in participants (for messages sent via Communication module)
      if (client?.first_name && client?.last_name) {
        const clientName = `${client.first_name} ${client.last_name}`.trim();
        const { data: nameParticipantThreads } = await supabase
          .from('message_participants')
          .select('thread_id')
          .eq('user_type', 'client')
          .ilike('user_name', `%${clientName}%`);

        if (nameParticipantThreads?.length) {
          const additionalThreadIds = nameParticipantThreads.map(p => p.thread_id);
          threadIds = [...new Set([...threadIds, ...additionalThreadIds])];
        }
      }

      // Strategy 3: Search by email in participants
      if (client?.email) {
        const { data: emailParticipantThreads } = await supabase
          .from('message_participants')
          .select('thread_id')
          .eq('user_type', 'client')
          .ilike('user_name', `%${client.email}%`);

        if (emailParticipantThreads?.length) {
          const additionalThreadIds = emailParticipantThreads.map(p => p.thread_id);
          threadIds = [...new Set([...threadIds, ...additionalThreadIds])];
        }
      }

      if (threadIds.length === 0) {
        return [];
      }

      // Get thread details including admin_only flag
      const { data: threads, error: threadsError } = await supabase
        .from('message_threads')
        .select(`
          id,
          subject,
          admin_only,
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

      // Filter threads based on admin_only visibility
      const visibleThreads = isAdmin 
        ? threads 
        : threads.filter(t => !t.admin_only);

      // Process threads
      const processedThreads = await Promise.all(
        visibleThreads.map(async (thread) => {
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

          // Filter out the client from participant list for display
          const clientUserId = client?.auth_user_id;
          const displayParticipants = clientUserId 
            ? participants.filter(p => p.id !== clientUserId)
            : participants.filter(p => p.type !== 'client');

          return {
            id: thread.id,
            subject: thread.subject,
            participants: displayParticipants,
            lastMessage: latestMessage ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderName,
              timestamp: new Date(latestMessage.created_at)
            } : undefined,
            unreadCount,
            createdAt: thread.created_at,
            updatedAt: thread.updated_at,
            adminOnly: thread.admin_only
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

      // Check if current user is an admin
      const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'branch_admin';

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
          admin_eyes_only,
          created_at
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread messages:', error);
        return [];
      }

      if (!messages) return [];

      // Filter messages - hide admin_eyes_only from non-admins
      const visibleMessages = isAdmin 
        ? messages 
        : messages.filter(m => !m.admin_eyes_only);

      // Get participant names
      const { data: participants } = await supabase
        .from('message_participants')
        .select('user_id, user_name')
        .eq('thread_id', threadId);

      return visibleMessages.map(message => {
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
          attachments: (message.attachments as any[]) || [],
          adminEyesOnly: message.admin_eyes_only
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