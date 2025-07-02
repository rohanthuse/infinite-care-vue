
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export interface UnifiedUser {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'carer' | 'branch_admin' | 'super_admin';
  branchId?: string;
}

export interface MessageContact {
  id: string;
  name: string;
  avatar: string;
  type: 'client' | 'carer' | 'admin';
  status: 'online' | 'offline' | 'away';
  unread: number;
  email?: string;
  role?: string;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: MessageContact[];
  lastMessage?: {
    id: string;
    content: string;
    senderName: string;
    timestamp: Date;
    isRead: boolean;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
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

// Enhanced session validation with automatic refresh
const validateSession = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (sessionError || userError) {
    console.error('[useUnifiedMessaging] Session validation error:', sessionError || userError);
    throw new Error('Session validation failed');
  }
  
  if (!session || !user) {
    console.error('[useUnifiedMessaging] No valid session or user');
    throw new Error('Not authenticated');
  }

  // Check if session is expired and attempt refresh
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : new Date(0);
  const now = new Date();
  
  if (expiresAt <= now) {
    console.log('[useUnifiedMessaging] Session expired, attempting refresh...');
    
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !refreshData.session) {
      console.error('[useUnifiedMessaging] Session refresh failed:', refreshError);
      throw new Error('Session expired. Please refresh the page and log in again.');
    }
    
    console.log('[useUnifiedMessaging] Session refreshed successfully');
    return { session: refreshData.session, user: refreshData.user };
  }

  // Test database connectivity
  try {
    const { error: testError } = await supabase
      .from('user_roles')
      .select('role')
      .limit(1);
    
    if (testError) {
      console.error('[useUnifiedMessaging] Database connectivity test failed:', testError);
      throw new Error('Database connection failed. Please refresh the page.');
    }
  } catch (error) {
    console.error('[useUnifiedMessaging] Database test error:', error);
    throw new Error('Database connection failed. Please refresh the page.');
  }
  
  return { session, user };
};

// Get current user with role information
export const useUnifiedUser = () => {
  const [user, setUser] = useState<UnifiedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { user: authUser } = await validateSession();
        
        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .single();

        if (roleError) {
          throw new Error('Could not determine user role');
        }

        let name = authUser.email?.split('@')[0] || 'User';
        let branchId: string | undefined;

        // Get additional user info based on role
        if (roleData.role === 'client') {
          const { data: clientData } = await supabase
            .from('clients')
            .select('first_name, last_name, branch_id')
            .eq('email', authUser.email)
            .single();
          
          if (clientData) {
            name = `${clientData.first_name} ${clientData.last_name}`.trim();
            branchId = clientData.branch_id;
          }
        } else if (roleData.role === 'carer') {
          const { data: staffData } = await supabase
            .from('staff')
            .select('first_name, last_name, branch_id')
            .eq('email', authUser.email)
            .single();
          
          if (staffData) {
            name = `${staffData.first_name} ${staffData.last_name}`.trim();
            branchId = staffData.branch_id;
          }
        } else if (roleData.role === 'branch_admin') {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', authUser.id)
            .single();
          
          if (profileData) {
            name = `${profileData.first_name} ${profileData.last_name}`.trim();
          }

          // Get admin's first branch (admins can have multiple)
          const { data: branchData } = await supabase
            .from('admin_branches')
            .select('branch_id')
            .eq('admin_id', authUser.id)
            .limit(1)
            .single();
          
          if (branchData) {
            branchId = branchData.branch_id;
          }
        }

        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name,
          role: roleData.role,
          branchId
        });
        
        setError(null);
      } catch (err: any) {
        console.error('[useUnifiedUser] Error loading user:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading, error };
};

// Get message threads for current user
export const useMessageThreads = () => {
  const { user } = useUnifiedUser();
  
  return useQuery({
    queryKey: ['message-threads', user?.id],
    queryFn: async (): Promise<MessageThread[]> => {
      if (!user) return [];

      try {
        await validateSession();
      } catch (error: any) {
        console.error('[useMessageThreads] Session validation failed:', error);
        toast.error(error.message);
        return [];
      }

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
        throw error;
      }

      if (!threads) return [];

      // Filter threads where current user is a participant
      const userThreads = threads.filter(thread => 
        thread.message_participants?.some(p => p.user_id === user.id)
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
            .eq('user_id', user.id)
            .in('message_id', allMessages?.map(m => m.id) || []);

          const unreadCount = (allMessages?.length || 0) - (readMessages?.length || 0);

          // Process participants
          const participants: MessageContact[] = thread.message_participants?.map(p => ({
            id: p.user_id,
            name: p.user_name,
            avatar: p.user_name.split(' ').map(n => n.charAt(0)).join(''),
            type: p.user_type === 'carer' ? 'carer' : p.user_type === 'client' ? 'client' : 'admin',
            status: 'online' as const,
            unread: 0
          })) || [];

          return {
            id: thread.id,
            subject: thread.subject,
            participants: participants.filter(p => p.id !== user.id), // Exclude self
            lastMessage: latestMessage ? {
              id: latestMessage.id,
              content: latestMessage.content,
              senderName: thread.message_participants?.find(p => p.user_id === latestMessage.sender_id)?.user_name || 'Unknown',
              timestamp: new Date(latestMessage.created_at),
              isRead: readMessages?.some(r => r.message_id === latestMessage.id) || false
            } : undefined,
            unreadCount,
            createdAt: thread.created_at,
            updatedAt: thread.updated_at
          };
        })
      );

      return processedThreads;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      if (error.message?.includes('not authenticated') || error.message?.includes('Session validation failed')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Get messages for a specific thread
export const useThreadMessages = (threadId: string) => {
  const { user } = useUnifiedUser();

  return useQuery({
    queryKey: ['thread-messages', threadId],
    queryFn: async (): Promise<Message[]> => {
      if (!user || !threadId) return [];

      try {
        await validateSession();
      } catch (error: any) {
        console.error('[useThreadMessages] Session validation failed:', error);
        return [];
      }

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
        .eq('user_id', user.id)
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
          hasAttachments: message.has_attachments || false,
          attachments: parseAttachments(message.attachments)
        };
      }) || [];
    },
    enabled: !!user && !!threadId,
  });
};

// Send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useUnifiedUser();

  return useMutation({
    mutationFn: async ({ 
      threadId, 
      content 
    }: { 
      threadId: string; 
      content: string; 
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { session, user: validatedUser } = await validateSession();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: validatedUser.id,
          sender_type: user.role === 'client' ? 'client' : user.role === 'carer' ? 'carer' : 'branch_admin',
          content,
          has_attachments: false,
          attachments: []
        })
        .select()
        .single();

      if (error) {
        console.error('[useSendMessage] Send message error:', error);
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
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['thread-messages', data.thread_id] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast.error(error.message || 'Failed to send message');
    }
  });
};

// Get contacts for messaging (role-based)
export const useMessagingContacts = () => {
  const { user } = useUnifiedUser();
  
  return useQuery({
    queryKey: ['messaging-contacts', user?.id, user?.role],
    queryFn: async (): Promise<MessageContact[]> => {
      if (!user) return [];

      try {
        await validateSession();
      } catch (error: any) {
        console.error('[useMessagingContacts] Session validation failed:', error);
        toast.error(error.message);
        return [];
      }

      const contacts: MessageContact[] = [];

      if (user.role === 'client') {
        // Clients can message admins from their branch
        if (user.branchId) {
          const { data: adminBranches, error } = await supabase
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
            .eq('branch_id', user.branchId);

          if (!error && adminBranches) {
            adminBranches.forEach(admin => {
              if (admin.profiles) {
                const firstName = admin.profiles.first_name || '';
                const lastName = admin.profiles.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Care Coordinator';
                
                contacts.push({
                  id: admin.admin_id,
                  name: fullName,
                  avatar: `${firstName.charAt(0) || 'C'}${lastName.charAt(0) || 'C'}`,
                  type: 'admin',
                  status: 'online',
                  unread: 0,
                  email: admin.profiles.email,
                  role: 'admin'
                });
              }
            });
          }
        }
      } else if (user.role === 'branch_admin') {
        // Admins can message clients and carers from their branches
        const { data: branches } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', user.id);

        if (branches && branches.length > 0) {
          const branchIds = branches.map(b => b.branch_id);

          // Get clients
          const { data: clients } = await supabase
            .from('clients')
            .select('id, first_name, last_name, email')
            .in('branch_id', branchIds);

          if (clients) {
            clients.forEach(client => {
              const fullName = `${client.first_name} ${client.last_name}`.trim();
              contacts.push({
                id: client.id,
                name: fullName,
                avatar: `${client.first_name?.charAt(0) || 'C'}${client.last_name?.charAt(0) || 'L'}`,
                type: 'client',
                status: 'online',
                unread: 0,
                email: client.email
              });
            });
          }

          // Get carers
          const { data: carers } = await supabase
            .from('staff')
            .select('id, first_name, last_name, email')
            .in('branch_id', branchIds);

          if (carers) {
            carers.forEach(carer => {
              const fullName = `${carer.first_name} ${carer.last_name}`.trim();
              contacts.push({
                id: carer.id,
                name: fullName,
                avatar: `${carer.first_name?.charAt(0) || 'C'}${carer.last_name?.charAt(0) || 'A'}`,
                type: 'carer',
                status: 'online',
                unread: 0,
                email: carer.email
              });
            });
          }
        }
      } else if (user.role === 'carer') {
        // Carers can message admins from their branch
        if (user.branchId) {
          const { data: adminBranches, error } = await supabase
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
            .eq('branch_id', user.branchId);

          if (!error && adminBranches) {
            adminBranches.forEach(admin => {
              if (admin.profiles) {
                const firstName = admin.profiles.first_name || '';
                const lastName = admin.profiles.last_name || '';
                const fullName = `${firstName} ${lastName}`.trim() || 'Administrator';
                
                contacts.push({
                  id: admin.admin_id,
                  name: fullName,
                  avatar: `${firstName.charAt(0) || 'A'}${lastName.charAt(0) || 'D'}`,
                  type: 'admin',
                  status: 'online',
                  unread: 0,
                  email: admin.profiles.email,
                  role: 'admin'
                });
              }
            });
          }
        }
      }

      console.log('[useMessagingContacts] Loaded contacts:', {
        userRole: user.role,
        branchId: user.branchId,
        contactCount: contacts.length
      });

      return contacts;
    },
    enabled: !!user,
    staleTime: 300000, // 5 minutes
    retry: (failureCount, error) => {
      if (error.message?.includes('not authenticated') || error.message?.includes('Session validation failed')) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Create a new message thread
export const useCreateThread = () => {
  const queryClient = useQueryClient();
  const { user } = useUnifiedUser();

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
      recipientType: 'client' | 'carer' | 'admin';
      subject: string; 
      initialMessage: string 
    }) => {
      if (!user) throw new Error('Not authenticated');

      console.log('[useCreateThread] Starting thread creation...');
      
      const { session, user: validatedUser } = await validateSession();
      
      console.log('[useCreateThread] Session validated for user:', validatedUser.id, validatedUser.email);

      // Create thread
      const threadData = {
        subject,
        branch_id: user.branchId,
        created_by: validatedUser.id
      };

      console.log('[useCreateThread] Creating thread with data:', threadData);

      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert(threadData)
        .select()
        .single();

      if (threadError) {
        console.error('[useCreateThread] Thread creation failed:', threadError);
        throw new Error(`Failed to create message thread: ${threadError.message}`);
      }

      console.log('[useCreateThread] Thread created:', thread);

      // Add participants
      const participants = [
        {
          thread_id: thread.id,
          user_id: validatedUser.id,
          user_type: user.role === 'client' ? 'client' : user.role === 'carer' ? 'carer' : 'branch_admin',
          user_name: user.name
        },
        {
          thread_id: thread.id,
          user_id: recipientId,
          user_type: recipientType === 'admin' ? 'branch_admin' : recipientType,
          user_name: recipientName
        }
      ];

      console.log('[useCreateThread] Adding participants:', participants);

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(participants);

      if (participantsError) {
        console.error('[useCreateThread] Participants creation failed:', participantsError);
        throw new Error(`Failed to add participants: ${participantsError.message}`);
      }

      // Send initial message
      console.log('[useCreateThread] Sending initial message...');
      
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: validatedUser.id,
          sender_type: user.role === 'client' ? 'client' : user.role === 'carer' ? 'carer' : 'branch_admin',
          content: initialMessage
        });

      if (messageError) {
        console.error('[useCreateThread] Initial message failed:', messageError);
        throw new Error(`Failed to send initial message: ${messageError.message}`);
      }

      console.log('[useCreateThread] Thread creation completed successfully');
      return thread;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error('[useCreateThread] Final error:', error);
      toast.error(error.message || 'Failed to send message');
    }
  });
};
