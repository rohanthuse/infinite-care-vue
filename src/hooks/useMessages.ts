
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole, type UserRole } from './useUserRole';

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderType: UserRole;
  senderName: string;
  content: string;
  hasAttachments: boolean;
  attachments: any[];
  createdAt: string;
  isRead: boolean;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: Array<{
    id: string;
    name: string;
    type: UserRole;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const useMessageThreads = (branchId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['messageThreads', branchId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data: threads, error } = await supabase
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
        .eq('branch_id', branchId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const threadsWithMessages = await Promise.all(
        (threads || []).map(async (thread) => {
          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select(`
              id,
              sender_id,
              sender_type,
              content,
              has_attachments,
              attachments,
              created_at
            `)
            .eq('thread_id', thread.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
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

          // Get sender name for latest message
          let senderName = 'Unknown';
          if (latestMessage) {
            const participant = thread.message_participants?.find(
              p => p.user_id === latestMessage.sender_id
            );
            senderName = participant?.user_name || 'Unknown';
          }

          return {
            id: thread.id,
            subject: thread.subject,
            participants: thread.message_participants?.map(p => ({
              id: p.user_id,
              name: p.user_name,
              type: p.user_type as UserRole
            })) || [],
            lastMessage: latestMessage ? {
              id: latestMessage.id,
              threadId: thread.id,
              senderId: latestMessage.sender_id,
              senderType: latestMessage.sender_type as UserRole,
              senderName,
              content: latestMessage.content,
              hasAttachments: latestMessage.has_attachments,
              attachments: latestMessage.attachments || [],
              createdAt: latestMessage.created_at,
              isRead: (readMessages?.find(r => r.message_id === latestMessage.id)) ? true : false
            } : undefined,
            unreadCount,
            createdAt: thread.created_at,
            updatedAt: thread.updated_at
          };
        })
      );

      return threadsWithMessages;
    },
    enabled: !!currentUser,
  });
};

export const useThreadMessages = (threadId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['threadMessages', threadId],
    queryFn: async () => {
      if (!currentUser) return [];

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

      if (error) throw error;

      // Get participant names
      const { data: participants } = await supabase
        .from('message_participants')
        .select('user_id, user_name')
        .eq('thread_id', threadId);

      // Get read status for messages
      const { data: readStatus } = await supabase
        .from('message_read_status')
        .select('message_id')
        .eq('user_id', currentUser.id)
        .in('message_id', messages?.map(m => m.id) || []);

      return messages?.map(message => {
        const participant = participants?.find(p => p.user_id === message.sender_id);
        const isRead = readStatus?.some(r => r.message_id === message.id) || false;

        return {
          id: message.id,
          threadId: message.thread_id,
          senderId: message.sender_id,
          senderType: message.sender_type as UserRole,
          senderName: participant?.user_name || 'Unknown',
          content: message.content,
          hasAttachments: message.has_attachments,
          attachments: message.attachments || [],
          createdAt: message.created_at,
          isRead
        };
      }) || [];
    },
    enabled: !!threadId && !!currentUser,
  });
};

export const useSendMessage = () => {
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
      attachments?: any[] 
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
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
      queryClient.invalidateQueries({ queryKey: ['threadMessages', data.thread_id] });
    }
  });
};

export const useCreateThread = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ 
      subject, 
      branchId, 
      participants, 
      initialMessage 
    }: { 
      subject: string; 
      branchId: string; 
      participants: Array<{ id: string; name: string; type: UserRole }>; 
      initialMessage: string 
    }) => {
      if (!currentUser) throw new Error('Not authenticated');

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject,
          branch_id: branchId,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants (including current user)
      const allParticipants = [
        { id: currentUser.id, name: currentUser.email, type: currentUser.role },
        ...participants
      ];

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(
          allParticipants.map(p => ({
            thread_id: thread.id,
            user_id: p.id,
            user_type: p.type,
            user_name: p.name
          }))
        );

      if (participantsError) throw participantsError;

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUser.id,
          sender_type: currentUser.role,
          content: initialMessage
        });

      if (messageError) throw messageError;

      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageThreads'] });
    }
  });
};
