
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';

export interface UnifiedContact {
  id: string;
  name: string;
  avatar: string;
  type: 'carer' | 'branch_admin' | 'client';
  status: 'online' | 'offline' | 'away';
  unread: number;
  email?: string;
  role?: string;
}

export interface UnifiedMessage {
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

export interface UnifiedMessageThread {
  id: string;
  subject: string;
  participants: UnifiedContact[];
  lastMessage?: UnifiedMessage;
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

// Get available contacts for messaging (admins, carers, clients based on user type)
export const useAvailableContacts = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['available-contacts', currentUser?.id],
    queryFn: async (): Promise<UnifiedContact[]> => {
      if (!currentUser) return [];

      const contacts: UnifiedContact[] = [];

      // If user is admin/super_admin, get clients and carers in their branches
      if (currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') {
        // Get branch access for admin
        let branchIds: string[] = [];
        
        if (currentUser.role === 'super_admin') {
          // Super admin can see all branches
          const { data: branches } = await supabase
            .from('branches')
            .select('id');
          branchIds = branches?.map(b => b.id) || [];
        } else {
          // Regular admin - get their assigned branches
          const { data: adminBranches } = await supabase
            .from('admin_branches')
            .select('branch_id')
            .eq('admin_id', currentUser.id);
          branchIds = adminBranches?.map(ab => ab.branch_id) || [];
        }

        if (branchIds.length > 0) {
          // Get clients for these branches
          const { data: clients } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email')
            .in('branch_id', branchIds)
            .eq('status', 'active');

          if (clients) {
            clients.forEach(client => {
              contacts.push({
                id: client.id,
                name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email?.split('@')[0] || 'Client',
                avatar: `${client.first_name?.charAt(0) || 'C'}${client.last_name?.charAt(0) || 'L'}`,
                type: 'client' as const,
                status: 'online' as const,
                unread: 0,
                email: client.email,
                role: 'client'
              });
            });
          }

          // Get carers for these branches
          const { data: carers } = await supabase
            .from('staff')
            .select('id, first_name, last_name, email')
            .in('branch_id', branchIds)
            .eq('status', 'active');

          if (carers) {
            carers.forEach(carer => {
              contacts.push({
                id: carer.id,
                name: `${carer.first_name || ''} ${carer.last_name || ''}`.trim() || carer.email?.split('@')[0] || 'Carer',
                avatar: `${carer.first_name?.charAt(0) || 'C'}${carer.last_name?.charAt(0) || 'R'}`,
                type: 'carer' as const,
                status: 'online' as const,
                unread: 0,
                email: carer.email,
                role: 'carer'
              });
            });
          }
        }
      }

      // If user is client, get admins for their branch
      if (currentUser.role === 'client') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return [];

        // Get client's branch
        const { data: client } = await supabase
          .from('clients')
          .select('id, branch_id, first_name, last_name, email')
          .eq('email', user.email)
          .single();

        if (client?.branch_id) {
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

          if (adminBranches) {
            adminBranches.forEach(admin => {
              if (admin.profiles) {
                contacts.push({
                  id: admin.admin_id,
                  name: `${admin.profiles.first_name || ''} ${admin.profiles.last_name || ''}`.trim() || 'Admin',
                  avatar: `${admin.profiles.first_name?.charAt(0) || 'A'}${admin.profiles.last_name?.charAt(0) || 'D'}`,
                  type: 'branch_admin' as const,
                  status: 'online' as const,
                  unread: 0,
                  email: admin.profiles.email,
                  role: 'branch_admin'
                });
              }
            });
          }
        }
      }

      return contacts;
    },
    enabled: !!currentUser,
    staleTime: 300000, // 5 minutes
  });
};

// Get message threads for current user
export const useUnifiedMessageThreads = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['unified-message-threads', currentUser?.id],
    queryFn: async (): Promise<UnifiedMessageThread[]> => {
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
        console.error('Error fetching message threads:', error);
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

          // Process participants (exclude self)
          const participants: UnifiedContact[] = thread.message_participants?.map(p => ({
            id: p.user_id,
            name: p.user_name,
            avatar: p.user_name.split(' ').map(n => n.charAt(0)).join(''),
            type: p.user_type === 'carer' ? 'carer' as const : 
                  p.user_type === 'client' ? 'client' as const : 'branch_admin' as const,
            status: 'online' as const,
            unread: 0
          })).filter(p => p.id !== currentUser.id) || [];

          return {
            id: thread.id,
            subject: thread.subject,
            participants,
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
export const useUnifiedThreadMessages = (threadId: string) => {
  const { data: currentUser } = useUserRole();

  return useQuery({
    queryKey: ['unified-thread-messages', threadId],
    queryFn: async (): Promise<UnifiedMessage[]> => {
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
export const useUnifiedSendMessage = () => {
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
          sender_type: currentUser.role === 'client' ? 'client' : 
                      currentUser.role === 'carer' ? 'carer' : 
                      currentUser.role === 'super_admin' ? 'super_admin' : 'branch_admin',
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
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['unified-thread-messages', data.thread_id] });
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
export const useUnifiedCreateThread = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ 
      recipientIds,
      recipientNames,
      recipientTypes,
      subject, 
      initialMessage 
    }: { 
      recipientIds: string[];
      recipientNames: string[];
      recipientTypes: string[];
      subject: string; 
      initialMessage: string 
    }) => {
      console.log('[useUnifiedCreateThread] Starting thread creation...');
      
      if (!currentUser) {
        throw new Error('Not authenticated - please log in again');
      }

      // Get user's branch for thread context
      let branchId: string | null = null;
      
      if (currentUser.role === 'client') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: client } = await supabase
            .from('clients')
            .select('branch_id')
            .eq('email', user.email)
            .single();
          branchId = client?.branch_id || null;
        }
      } else if (currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') {
        // For admins, get the first branch they have access to
        if (currentUser.role === 'super_admin') {
          const { data: firstBranch } = await supabase
            .from('branches')
            .select('id')
            .limit(1)
            .single();
          branchId = firstBranch?.id || null;
        } else {
          const { data: adminBranch } = await supabase
            .from('admin_branches')
            .select('branch_id')
            .eq('admin_id', currentUser.id)
            .limit(1)
            .single();
          branchId = adminBranch?.branch_id || null;
        }
      }

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

      if (threadError) {
        console.error('[useUnifiedCreateThread] Thread creation failed:', threadError);
        throw new Error(`Failed to create message thread: ${threadError.message}`);
      }

      // Get current user's name
      let currentUserName = 'User';
      if (currentUser.role === 'client') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const { data: client } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('email', user.email)
            .single();
          if (client) {
            currentUserName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || user.email?.split('@')[0] || 'Client';
          }
        }
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', currentUser.id)
          .single();
        if (profile) {
          currentUserName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin';
        }
      }

      // Add participants
      const participants = [
        {
          thread_id: thread.id,
          user_id: currentUser.id,
          user_type: currentUser.role === 'client' ? 'client' : 
                    currentUser.role === 'carer' ? 'carer' : 
                    currentUser.role === 'super_admin' ? 'super_admin' : 'branch_admin',
          user_name: currentUserName
        }
      ];

      // Add recipients
      recipientIds.forEach((recipientId, index) => {
        participants.push({
          thread_id: thread.id,
          user_id: recipientId,
          user_type: recipientTypes[index] === 'carer' ? 'carer' : 
                    recipientTypes[index] === 'client' ? 'client' : 'branch_admin',
          user_name: recipientNames[index]
        });
      });

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(participants);

      if (participantsError) {
        console.error('[useUnifiedCreateThread] Participants creation failed:', participantsError);
        throw new Error(`Failed to add participants: ${participantsError.message}`);
      }

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: currentUser.id,
          sender_type: currentUser.role === 'client' ? 'client' : 
                      currentUser.role === 'carer' ? 'carer' : 
                      currentUser.role === 'super_admin' ? 'super_admin' : 'branch_admin',
          content: initialMessage
        });

      if (messageError) {
        console.error('[useUnifiedCreateThread] Initial message failed:', messageError);
        throw new Error(`Failed to send initial message: ${messageError.message}`);
      }

      console.log('[useUnifiedCreateThread] Thread creation completed successfully');
      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error('[useUnifiedCreateThread] Final error:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  });
};
