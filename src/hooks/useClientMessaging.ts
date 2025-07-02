
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

// Enhanced session validation helper
const validateSession = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (sessionError || userError) {
    console.error('[useClientMessaging] Session validation error:', sessionError || userError);
    throw new Error('Session validation failed');
  }
  
  if (!session || !user) {
    console.error('[useClientMessaging] No valid session or user');
    throw new Error('Not authenticated - please log in again');
  }
  
  // Check if session is expired
  if (session.expires_at && new Date(session.expires_at * 1000) <= new Date()) {
    console.error('[useClientMessaging] Session expired');
    throw new Error('Session expired - please log in again');
  }
  
  console.log('[useClientMessaging] Session validated:', {
    userId: user.id,
    email: user.email,
    expiresAt: session.expires_at ? new Date(session.expires_at * 1000) : 'never'
  });
  
  return { session, user };
};

// Get client's care administrators (only admins assigned to their branch)
export const useClientCareTeam = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['client-care-team'],
    queryFn: async (): Promise<ClientContact[]> => {
      if (!currentUser) {
        console.log('[useClientCareTeam] No current user');
        return [];
      }

      // Validate session before making database queries
      try {
        await validateSession();
      } catch (error: any) {
        console.error('[useClientCareTeam] Session validation failed:', error);
        return [];
      }

      // Get current client info from localStorage and verify with database
      const clientId = localStorage.getItem("clientId");
      const clientEmail = localStorage.getItem("clientEmail") || currentUser.email;
      
      console.log('[useClientCareTeam] Client info:', { clientId, clientEmail, currentUserId: currentUser.id });

      if (!clientId && !clientEmail) {
        console.log('[useClientCareTeam] No client identification available');
        return [];
      }

      // Get client record to find branch
      let clientQuery = supabase.from('clients').select('id, branch_id, email');
      
      if (clientId) {
        clientQuery = clientQuery.eq('id', clientId);
      } else {
        clientQuery = clientQuery.eq('email', clientEmail);
      }

      const { data: client, error: clientError } = await clientQuery.single();

      if (clientError || !client?.branch_id) {
        console.error('[useClientCareTeam] Client lookup error:', clientError);
        return [];
      }

      console.log('[useClientCareTeam] Found client:', client);

      // Get only admins for this branch
      const { data: adminBranches, error: adminError } = await supabase
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

      if (adminError) {
        console.error('[useClientCareTeam] Admin lookup error:', adminError);
        return [];
      }

      const contacts: ClientContact[] = [];

      // Add only admins
      if (adminBranches) {
        adminBranches.forEach(admin => {
          if (admin.profiles) {
            contacts.push({
              id: admin.admin_id,
              name: `${admin.profiles.first_name || ''} ${admin.profiles.last_name || ''}`.trim() || 'Admin',
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

      console.log('[useClientCareTeam] Found contacts:', contacts);
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

// Send a message to existing thread with enhanced validation
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
      // Enhanced session validation
      const { session, user } = await validateSession();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          sender_type: 'client',
          content,
          has_attachments: false,
          attachments: []
        })
        .select()
        .single();

      if (error) {
        if (error.message?.includes('row-level security')) {
          throw new Error('Permission denied: Authentication context lost. Please refresh the page and try again.');
        }
        throw error;
      }

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

// Create a new message thread with enhanced validation
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
      console.log('[useClientCreateThread] Starting thread creation...');
      
      // Enhanced session validation
      const { session, user } = await validateSession();
      
      console.log('[useClientCreateThread] Session validated for user:', user.id, user.email);

      // Verify user has client role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || roleData?.role !== 'client') {
        console.error('[useClientCreateThread] Role verification failed:', { roleError, role: roleData?.role });
        throw new Error('Access denied - client role required');
      }

      console.log('[useClientCreateThread] Role verified:', roleData.role);

      // Get client information
      const clientId = localStorage.getItem("clientId");
      const clientName = localStorage.getItem("clientName") || user.email?.split('@')[0] || 'Client';
      
      if (!clientId) {
        console.error('[useClientCreateThread] No client ID found');
        throw new Error('Client information not found - please log in again');
      }

      // Get client's branch
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, branch_id, first_name, last_name')
        .eq('id', clientId)
        .single();

      if (clientError || !client?.branch_id) {
        console.error('[useClientCreateThread] Client lookup failed:', clientError);
        throw new Error('Client profile not found');
      }

      console.log('[useClientCreateThread] Client data:', client);

      // Create thread with explicit user context and additional debugging
      const threadData = {
        subject,
        branch_id: client.branch_id,
        created_by: user.id
      };

      console.log('[useClientCreateThread] Creating thread with data:', threadData);
      console.log('[useClientCreateThread] Current session context:', {
        userId: user.id,
        email: user.email,
        sessionValid: session.expires_at ? new Date(session.expires_at * 1000) > new Date() : true
      });

      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert(threadData)
        .select()
        .single();

      if (threadError) {
        console.error('[useClientCreateThread] Thread creation failed:', threadError);
        
        // Enhanced error handling for RLS violations
        if (threadError.message?.includes('row-level security')) {
          console.error('[useClientCreateThread] RLS violation - auth context:', {
            authUid: user.id,
            threadCreatedBy: threadData.created_by,
            sessionExpiry: session.expires_at
          });
          throw new Error('Permission denied: Authentication context lost. Please refresh the page and try again.');
        }
        
        throw new Error(`Failed to create message thread: ${threadError.message}`);
      }

      console.log('[useClientCreateThread] Thread created:', thread);

      // Add participants
      const participants = [
        {
          thread_id: thread.id,
          user_id: user.id,
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

      console.log('[useClientCreateThread] Adding participants:', participants);

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(participants);

      if (participantsError) {
        console.error('[useClientCreateThread] Participants creation failed:', participantsError);
        throw new Error(`Failed to add participants: ${participantsError.message}`);
      }

      // Send initial message
      console.log('[useClientCreateThread] Sending initial message...');
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: user.id,
          sender_type: 'client',
          content: initialMessage
        });

      if (messageError) {
        console.error('[useClientCreateThread] Initial message failed:', messageError);
        throw new Error(`Failed to send initial message: ${messageError.message}`);
      }

      console.log('[useClientCreateThread] Thread creation completed successfully');
      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error('[useClientCreateThread] Final error:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  });
};
