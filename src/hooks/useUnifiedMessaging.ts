
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { useTenant } from '@/contexts/TenantContext';
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
  canMessage?: boolean; // false if no auth account
  clientDbId?: string; // client's database ID for lookup
  hasAuthAccount?: boolean;
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
  messageType?: string;
  priority?: string;
  actionRequired?: boolean;
  adminEyesOnly?: boolean;
  notificationMethods?: string[];
  isEdited?: boolean;
}

export interface UnifiedMessageThread {
  id: string;
  subject: string;
  participants: UnifiedContact[];
  lastMessage?: UnifiedMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  threadType?: string;
  requiresAction?: boolean;
  adminOnly?: boolean;
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
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['available-contacts', currentUser?.id, organization?.id],
    queryFn: async (): Promise<UnifiedContact[]> => {
      if (!currentUser || !organization?.id) return [];

      const contacts: UnifiedContact[] = [];

      // If user is admin/super_admin, get clients and carers in their branches (filtered by organization)
      if (currentUser.role === 'branch_admin' || currentUser.role === 'super_admin') {
        // Get branch access for admin within current organization only
        let branchIds: string[] = [];
        
        if (currentUser.role === 'super_admin') {
          // Super admin can see branches ONLY within current organization
          const { data: branches } = await supabase
            .from('branches')
            .select('id')
            .eq('organization_id', organization.id);
          branchIds = branches?.map(b => b.id) || [];
        } else {
          // Regular admin - get their assigned branches within current organization
          const { data: adminBranches } = await supabase
            .from('admin_branches')
            .select('branch_id, branches!inner(organization_id)')
            .eq('admin_id', currentUser.id)
            .eq('branches.organization_id', organization.id);
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
            // For each client, find their auth user ID (if they have one)
            for (const client of clients) {
              // Find auth user ID by email - clients may or may not have auth accounts
              let authUser = null;
              if (client.email) {
                const { data: authUsers } = await supabase
                  .from('user_roles')
                  .select(`
                    user_id,
                    profiles!inner (
                      id,
                      email
                    )
                  `)
                  .eq('role', 'client')
                  .eq('profiles.email', client.email);
                
                authUser = authUsers?.[0];
              }
              
              const hasAuthAccount = !!authUser;
              
              // Include ALL clients - use auth ID if available, else use client DB ID
              contacts.push({
                id: authUser?.user_id || client.id, // Use auth ID if exists, else DB ID
                clientDbId: client.id, // Always store the DB ID for lookup
                name: `${client.first_name || ''} ${client.last_name || ''}`.trim() || client.email?.split('@')[0] || 'Client',
                avatar: `${client.first_name?.charAt(0) || 'C'}${client.last_name?.charAt(0) || 'L'}`,
                type: 'client' as const,
                status: 'online' as const,
                unread: 0,
                email: client.email,
                role: 'client',
                canMessage: hasAuthAccount, // Can only deliver messages if they have auth
                hasAuthAccount
              });
            }
          }

          // Get carers for these branches
          const { data: carers } = await supabase
            .from('staff')
            .select('id, first_name, last_name, email')
            .in('branch_id', branchIds)
            .eq('status', 'active');

          if (carers) {
            // For each carer, find their auth user ID
            for (const carer of carers) {
              if (!carer.email) continue;
              
              // Find auth user ID by staff record
              const { data: staffAuth } = await supabase
                .from('staff')
                .select('auth_user_id')
                .eq('id', carer.id)
                .single();
              
              if (!staffAuth?.auth_user_id) {
                console.warn(`[useAvailableContacts] Carer ${carer.email} has no auth_user_id - skipping`);
                continue; // Skip carers without auth accounts
              }
              
              contacts.push({
                id: staffAuth.auth_user_id, // Use auth user ID instead of staff DB ID
                name: `${carer.first_name || ''} ${carer.last_name || ''}`.trim() || carer.email?.split('@')[0] || 'Carer',
                avatar: `${carer.first_name?.charAt(0) || 'C'}${carer.last_name?.charAt(0) || 'R'}`,
                type: 'carer' as const,
                status: 'online' as const,
                unread: 0,
                email: carer.email,
                role: 'carer'
              });
            }
          }
        }
      }

      // If user is client, get admins for their branch
      if (currentUser.role === 'client') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return [];

        // Get client's branch with enhanced matching
        const { data: client } = await supabase
          .from('clients') 
          .select('id, branch_id, first_name, last_name, email')
          .eq('email', user.email)
          .maybeSingle();

        if (client?.branch_id) {
          // Get admin branches first, then profiles separately to avoid RLS issues
          const { data: adminBranches } = await supabase
            .from('admin_branches')
            .select('admin_id')
            .eq('branch_id', client.branch_id);

          if (adminBranches && adminBranches.length > 0) {
            const adminIds = adminBranches.map(ab => ab.admin_id);
            
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, email')
              .in('id', adminIds);

            adminBranches.forEach(admin => {
              const profile = profiles?.find(p => p.id === admin.admin_id);
              contacts.push({
                id: admin.admin_id,
                name: profile 
                  ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Admin'
                  : 'Admin',
                avatar: profile 
                  ? `${profile.first_name?.charAt(0) || 'A'}${profile.last_name?.charAt(0) || 'D'}`
                  : 'AD',
                type: 'branch_admin' as const,
                status: 'online' as const,
                unread: 0,
                email: profile?.email || 'admin@system.com',
                role: 'branch_admin'
              });
            });
          }
        }
      }

      return contacts;
    },
    enabled: !!currentUser && !!organization?.id,
    staleTime: 300000, // 5 minutes
  });
};

// Get message threads for current user
export const useUnifiedMessageThreads = () => {
  const { data: currentUser } = useUserRole();
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['unified-message-threads', currentUser?.id, organization?.id],
    queryFn: async (): Promise<UnifiedMessageThread[]> => {
      console.log('[useUnifiedMessageThreads] Starting with user:', currentUser, 'org:', organization?.id);
      
      if (!currentUser || !organization?.id) {
        console.log('[useUnifiedMessageThreads] No current user or organization found');
        return [];
      }

      try {
        const { data: threads, error } = await supabase
          .from('message_threads')
          .select(`
            id,
            subject,
            thread_type,
            requires_action,
            admin_only,
            created_at,
            updated_at,
            last_message_at,
            organization_id,
            message_participants (
              user_id,
              user_type,
              user_name
            ),
            messages (
              id
            )
          `)
          .eq('organization_id', organization.id)
          .eq('is_deleted', false)
          .order('last_message_at', { ascending: false });

        if (error) {
          console.error('[useUnifiedMessageThreads] Error fetching threads:', error);
          throw error;
        }

        if (!threads) {
          console.log('[useUnifiedMessageThreads] No threads returned');
          return [];
        }

        console.log('[useUnifiedMessageThreads] Raw threads:', threads.length);

        // STRICT PARTICIPANT-ONLY ACCESS - NO CROSS-ORGANIZATION LEAKAGE
        const userThreads = threads.filter(thread => {
          if (!thread.message_participants || thread.message_participants.length === 0) {
            console.log(`[useUnifiedMessageThreads] Thread ${thread.id} has no participants, skipping`);
            return false;
          }
          
          // SUPER ADMIN SUPPORT ACCESS: Allow super_admins to see all support threads
          // in their organization even if not a direct participant
          if (currentUser.role === 'super_admin' && thread.thread_type === 'support') {
            console.log(`[useUnifiedMessageThreads] Thread ${thread.id} - super_admin support access granted`);
            return true;
          }
          
          // ONLY show threads where current user is a DIRECT participant - NO exceptions
          const isDirectParticipant = thread.message_participants.some(p => 
            p.user_id === currentUser.id
          );
          
          if (isDirectParticipant) {
            console.log(`[useUnifiedMessageThreads] Thread ${thread.id} - direct participant access granted`);
            return true;
          }
          
          console.log(`[useUnifiedMessageThreads] Thread ${thread.id} - access denied - not a participant`, {
            currentUserId: currentUser.id,
            currentUserRole: currentUser.role,
            participantIds: thread.message_participants.map(p => p.user_id)
          });
          
          return false;
        });

        console.log('[useUnifiedMessageThreads] Filtered threads for user:', userThreads.length);

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

          // Process participants with better name resolution
          const participants: UnifiedContact[] = thread.message_participants?.map(p => {
            // Provide better fallback names
            let displayName = p.user_name || 'Unknown User';
            
            // If no name but we have user type, provide a role-based name
            if (!p.user_name || p.user_name.trim() === '') {
              switch (p.user_type) {
                case 'client':
                  displayName = 'Client';
                  break;
                case 'carer':
                  displayName = 'Carer';
                  break;
                case 'branch_admin':
                case 'super_admin':
                  displayName = 'Administrator';
                  break;
                default:
                  displayName = 'User';
              }
            }
            
            return {
              id: p.user_id,
              name: displayName,
              avatar: displayName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase(),
              type: p.user_type === 'carer' ? 'carer' as const : 
                    p.user_type === 'client' ? 'client' as const : 'branch_admin' as const,
              status: 'online' as const,
              unread: 0
            };
          }).filter(p => p.id !== currentUser.id) || [];

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
            updatedAt: thread.updated_at,
            threadType: thread.thread_type,
            requiresAction: thread.requires_action,
            adminOnly: thread.admin_only
          };
        })
      );

        console.log('[useUnifiedMessageThreads] Processed threads:', processedThreads.length);
        return processedThreads;
      } catch (error) {
        console.error('[useUnifiedMessageThreads] Critical error:', error);
        throw error;
      }
    },
    enabled: !!currentUser && !!organization?.id,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time feel
    retry: 2,
    retryDelay: 1000,
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
            message_type,
            priority,
            action_required,
            admin_eyes_only,
            notification_methods,
            created_at,
            is_edited
          `)
          .eq('thread_id', threadId)
          .eq('is_deleted', false)
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
          attachments: parseAttachments(message.attachments),
          messageType: message.message_type,
          priority: message.priority,
          actionRequired: message.action_required,
          adminEyesOnly: message.admin_eyes_only,
          notificationMethods: message.notification_methods,
          isEdited: message.is_edited
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
      content,
      messageType = 'general',
      priority = 'normal',
      actionRequired = false,
      adminEyesOnly = false,
      attachments = [],
      notificationMethods = [],
      otherEmailAddress
    }: { 
      threadId: string; 
      content: string;
      messageType?: string;
      priority?: string;
      actionRequired?: boolean;
      adminEyesOnly?: boolean;
      attachments?: any[];
      notificationMethods?: string[];
      otherEmailAddress?: string;
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
          has_attachments: attachments.length > 0,
          attachments: attachments,
          message_type: messageType,
          priority,
          action_required: actionRequired,
          admin_eyes_only: adminEyesOnly,
          notification_methods: notificationMethods,
          other_email_address: otherEmailAddress
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
      queryClient.invalidateQueries({ queryKey: ['admin-thread-messages', data.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['client-thread-messages', data.thread_id] });
      queryClient.invalidateQueries({ queryKey: ['message-threads'] });
      toast.success('Message sent successfully');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  });
};

// Mark messages as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();

  return useMutation({
    mutationFn: async ({ messageIds }: { messageIds: string[] }) => {
      if (!currentUser || messageIds.length === 0) return;

      // Insert read status records (upsert to avoid duplicates)
      const readStatusRecords = messageIds.map(messageId => ({
        user_id: currentUser.id,
        message_id: messageId,
        read_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('message_read_status')
        .upsert(readStatusRecords, { 
          onConflict: 'user_id,message_id',
          ignoreDuplicates: true 
        });

      if (error) throw error;
      return messageIds;
    },
    onSuccess: (messageIds) => {
      // Invalidate all relevant queries to update unread counts
      queryClient.invalidateQueries({ queryKey: ['unified-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['unified-thread-messages'] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      queryClient.invalidateQueries({ queryKey: ['client-thread-messages'] });
      console.log(`Marked ${messageIds?.length || 0} messages as read`);
    },
    onError: (error) => {
      console.error('Failed to mark messages as read:', error);
    }
  });
};

// Create a new message thread
export const useUnifiedCreateThread = () => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useUserRole();
  const { organization } = useTenant();

  return useMutation({
    mutationFn: async ({ 
      recipientIds,
      recipientNames,
      recipientTypes,
      subject, 
      initialMessage,
      threadType = 'general',
      requiresAction = false,
      adminOnly = false,
      messageType = 'general',
      priority = 'normal',
      actionRequired = false,
      adminEyesOnly = false,
      attachments = [],
      notificationMethods = [],
      otherEmailAddress
     }: { 
      recipientIds: string[];
      recipientNames: string[];
      recipientTypes: string[];
      subject: string; 
      initialMessage: string;
      threadType?: string;
      requiresAction?: boolean;
      adminOnly?: boolean;
      messageType?: string;
      priority?: string;
      actionRequired?: boolean;
      adminEyesOnly?: boolean;
      attachments?: any[];
      notificationMethods?: string[];
      otherEmailAddress?: string;
    }) => {
      console.log('[useUnifiedCreateThread] Starting thread creation...');
      
      if (!currentUser || !organization?.id) {
        throw new Error('Not authenticated or organization context missing');
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
            .eq('organization_id', organization.id)
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

      // Create thread with organization context
      const { data: thread, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject,
          branch_id: branchId,
          organization_id: organization.id,
          created_by: currentUser.id,
          thread_type: threadType,
          requires_action: requiresAction,
          admin_only: adminOnly
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

      // Add recipients - they should already be validated by MessageComposer
      for (let i = 0; i < recipientIds.length; i++) {
        const recipientId = recipientIds[i];
        
        participants.push({
          thread_id: thread.id,
          user_id: recipientId, // Should be pre-validated by MessageComposer
          user_type: recipientTypes[i] === 'carer' || recipientTypes[i] === 'assigned_carer' ? 'carer' : 
                    recipientTypes[i] === 'client' ? 'client' : 
                    recipientTypes[i] === 'super_admin' ? 'super_admin' : 'branch_admin',
          user_name: recipientNames[i]
        });
      }
      
      if (recipientIds.length === 0) {
        throw new Error('No recipients provided');
      }

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
          content: initialMessage,
          has_attachments: attachments.length > 0,
          attachments: attachments,
          message_type: messageType,
          priority,
          action_required: actionRequired,
          admin_eyes_only: adminEyesOnly,
          notification_methods: notificationMethods,
          other_email_address: otherEmailAddress
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
