
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';

export interface ClientContact {
  id: string;
  name: string;
  avatar: string;
  type: 'carer' | 'admin';
  status: 'online' | 'offline' | 'away';
  unread: number;
  email?: string;
  role?: string;
}

export interface ClientMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: any[];
}

export interface ClientMessageThread {
  id: string;
  subject: string;
  participants: ClientContact[];
  lastMessage?: ClientMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to safely parse attachments
const parseAttachments = (attachments: any): any[] => {
  if (!attachments) return [];
  if (Array.isArray(attachments)) return attachments;
  try {
    const parsed = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Get client's care team (carers and admins assigned to their branch)
export const useClientCareTeam = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['client-care-team'],
    queryFn: async (): Promise<ClientContact[]> => {
      if (!currentUser) return [];

      // Get current client info
      const clientId = localStorage.getItem("clientId");
      if (!clientId) return [];

      const { data: client } = await supabase
        .from('clients')
        .select('branch_id')
        .eq('id', clientId)
        .single();

      if (!client?.branch_id) return [];

      // Get staff members from the same branch
      const { data: staff } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, status')
        .eq('branch_id', client.branch_id)
        .eq('status', 'active');

      // Get admins for this branch
      const { data: adminBranches } = await supabase
        .from('admin_branches')
        .select(`
          admin_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('branch_id', client.branch_id);

      const contacts: ClientContact[] = [];

      // Add staff members
      if (staff) {
        staff.forEach(member => {
          contacts.push({
            id: member.id,
            name: `${member.first_name} ${member.last_name}`,
            avatar: `${member.first_name?.charAt(0) || ''}${member.last_name?.charAt(0) || ''}`,
            type: 'carer',
            status: member.status === 'active' ? 'online' : 'offline',
            unread: 0, // Will be calculated separately
            email: member.email,
            role: 'carer'
          });
        });
      }

      // Add admins
      if (adminBranches) {
        adminBranches.forEach(admin => {
          if (admin.profiles) {
            contacts.push({
              id: admin.admin_id,
              name: `${admin.profiles.first_name || ''} ${admin.profiles.last_name || ''}`,
              avatar: `${admin.profiles.first_name?.charAt(0) || 'A'}${admin.profiles.last_name?.charAt(0) || 'D'}`,
              type: 'admin',
              status: 'online',
              unread: 0,
              email: admin.profiles.email,
              role: 'admin'
            });
          }
        });
      }

      return contacts;
    },
    enabled: !!currentUser,
    staleTime: 300000, // 5 minutes
  });
};

// Get client's message threads
export const useClientMessageThreads = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['client-message-threads', currentUser?.id],
    queryFn: async (): Promise<ClientMessageThread[]> => {
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
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching client message threads:', error);
        return [];
      }

      if (!threads) return [];

      // Filter threads where current user is a participant
      const userThreads = threads.filter(thread => 
        thread.message_participants?.some(p => p.user_id === currentUser.id)
      );

      const processedThreads = await Promise.all(
        userThreads.map(async (thread) => {
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

          // Process participants
          const participants: ClientContact[] = thread.message_participants?.map(p => ({
            id: p.user_id,
            name: p.user_name,
            avatar: p.user_name.split(' ').map(n => n.charAt(0)).join(''),
            type: p.user_type === 'carer' ? 'carer' : 'admin',
            status: 'online' as const,
            unread: 0
          })) || [];

          return {
            id: thread.id,
            subject: thread.subject,
            participants: participants.filter(p => p.id !== currentUser.id), // Exclude self
            lastMessage: latestMessage ? {
              id: latestMessage.id,
              threadId: thread.id,
              senderId: latestMessage.sender_id,
              senderName: thread.message_participants?.find(p => p.user_id === latestMessage.sender_id)?.user_name || 'Unknown',
              senderType: latestMessage.sender_type,
              content: latestMessage.content,
              timestamp: new Date(latestMessage.created_at),
              isRead: readMessages?.some(r => r.message_id === latestMessage.id) || false,
              hasAttachments: latestMessage.has_attachments,
              attachments: parseAttachments(latestMessage.attachments)
            } : undefined,
            unreadCount,
            createdAt: thread.created_at,
            updatedAt: thread.updated_at
          };
        })
      );

      return processedThreads;
    },
    enabled: !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
  });
};

// Get messages for a specific thread
export const useClientThreadMessages = (threadId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['client-thread-messages', threadId],
    queryFn: async (): Promise<ClientMessage[]> => {
      if (!currentUser || !threadId) return [];

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

      // Get participant names
      const { data: participants } = await supabase
        .from('message_participants')
        .select('user_id, user_name')
        .eq('thread_id', threadId);

      // Get read status
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
          senderName: participant?.user_name || 'Unknown',
          senderType: message.sender_type,
          content: message.content,
          timestamp: new Date(message.created_at),
          isRead,
          hasAttachments: message.has_attachments,
          attachments: parseAttachments(message.attachments)
        };
      }) || [];
    },
    enabled: !!currentUser && !!threadId,
  });
};

// Send a message to existing thread
export const useClientSendMessage = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ 
      threadId, 
      content 
    }: { 
      threadId: string; 
      content: string; 
    }) => {
      if (!currentUser) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: currentUser.id,
          sender_type: 'client',
          content,
          has_attachments: false,
          attachments: []
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
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  });
};

// Create a new message thread
export const useClientCreateThread = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ 
      recipientId,
      recipientName,
      recipientType,
      subject, 
      initialMessage 
    }: { 
      recipientId: string;
      recipientName: string;
      recipientType: 'carer' | 'admin';
      subject: string; 
      initialMessage: string 
    }) => {
      if (!currentUser) throw new Error('Not authenticated');

      const clientId = localStorage.getItem("clientId");
      const clientName = localStorage.getItem("clientName");
      
      if (!clientId || !clientName) throw new Error('Client information not found');

      // Get client's branch
      const { data: client } = await supabase
        .from('clients')
        .select('branch_id')
        .eq('id', clientId)
        .single();

      if (!client?.branch_id) throw new Error('Client branch not found');

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject,
          branch_id: client.branch_id,
          created_by: currentUser.id
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Add participants
      const participants = [
        {
          thread_id: thread.id,
          user_id: currentUser.id,
          user_type: 'client',
          user_name: clientName
        },
        {
          thread_id: thread.id,
          user_id: recipientId,
          user_type: recipientType,
          user_name: recipientName
        }
      ];

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(participants);

      if (participantsError) throw participantsError;

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUser.id,
          sender_type: 'client',
          content: initialMessage
        });

      if (messageError) throw messageError;

      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      console.error('Create thread error:', error);
      toast.error('Failed to send message');
    }
  });
};
