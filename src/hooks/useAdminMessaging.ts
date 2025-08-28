
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { useUnifiedMessageThreads, useUnifiedThreadMessages, useUnifiedSendMessage, useUnifiedCreateThread } from './useUnifiedMessaging';

// Admin-specific interfaces that extend the unified system
export interface AdminContact {
  id: string;
  name: string;
  avatar: string;
  type: 'carer' | 'client' | 'branch_admin' | 'super_admin';
  status: 'online' | 'offline' | 'away';
  unread: number;
  email?: string;
  role?: string;
  branchName?: string;
  canMessage?: boolean; // Whether this contact can be messaged (has auth_user_id)
}

export interface AdminMessage {
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
}

export interface AdminMessageThread {
  id: string;
  subject: string;
  participants: AdminContact[];
  lastMessage?: AdminMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  branchId?: string;
  threadType?: string;
  requiresAction?: boolean;
  adminOnly?: boolean;
}

// Get contacts available for admin messaging (clients and carers in their branches)
export const useAdminContacts = (branchId?: string) => {
  const { data: currentUser } = useUserRole();
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['admin-contacts', currentUser?.id, organization?.id, branchId],
    queryFn: async (): Promise<AdminContact[]> => {
      console.log('[useAdminContacts] Current user:', currentUser, 'Organization:', organization?.id);
      
      if (!currentUser || !organization) {
        console.log('[useAdminContacts] No current user or organization found');
        return [];
      }

      const contacts: AdminContact[] = [];

      try {

      // Get branch access for admin - FILTER BY ORGANIZATION
      let branchIds: string[] = [];
      
      if (branchId) {
        // If specific branchId is provided, use only that branch
        branchIds = [branchId];
        console.log('[useAdminContacts] Using specific branch:', branchId);
      } else if (currentUser.role === 'super_admin') {
        // Super admin can see branches ONLY within their current organization
        const { data: branches, error: branchError } = await supabase
          .from('branches')
          .select('id, name')
          .eq('organization_id', organization.id);
        
        if (branchError) {
          console.error('[useAdminContacts] Error fetching branches:', branchError);
          return [];
        }
        branchIds = branches?.map(b => b.id) || [];
        console.log('[useAdminContacts] Super admin branches for organization:', branchIds);
      } else if (currentUser.role === 'branch_admin') {
        // Regular admin - get their assigned branches WITHIN current organization
        const { data: adminBranches, error: adminBranchError } = await supabase
          .from('admin_branches')
          .select(`
            branch_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('admin_id', currentUser.id)
          .eq('branches.organization_id', organization.id);
        
        if (adminBranchError) {
          console.error('[useAdminContacts] Error fetching admin branches:', adminBranchError);
          return [];
        }
        branchIds = adminBranches?.map(ab => ab.branch_id) || [];
        console.log('[useAdminContacts] Branch admin branches for organization:', branchIds);
      } else {
        // For other user types, get branches within current organization only
        const { data: branches } = await supabase
          .from('branches')
          .select('id, name')
          .eq('organization_id', organization.id);
        branchIds = branches?.map(b => b.id) || [];
        console.log('[useAdminContacts] Other user type branches for organization:', branchIds);
      }

      console.log('[useAdminContacts] Branch IDs found:', branchIds);
      if (branchIds.length === 0) {
        console.log('[useAdminContacts] No branches found for user');
        return [];
      }

      // Get clients for these branches - with organization filter
      // Include ALL clients (remove status filter to show all 11 clients)
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          auth_user_id,
          branch_id,
          status,
          branches!inner (
            id,
            organization_id
          )
        `)
        .in('branch_id', branchIds)
        .eq('branches.organization_id', organization.id);

      if (clientError) {
        console.error('[useAdminContacts] Error fetching clients:', clientError);
      }

      console.log('[useAdminContacts] Total clients in branches:', clients?.length || 0);
      console.log('[useAdminContacts] Client details:', clients?.map(c => ({
        id: c.id, 
        name: `${c.first_name} ${c.last_name}`, 
        status: c.status,
        hasAuth: !!c.auth_user_id
      })) || []);
      if (clients) {
        for (const client of clients) {
          
          const firstName = client.first_name || '';
          const lastName = client.last_name || '';
          const displayName = `${firstName} ${lastName}`.trim() || 
                             client.email?.split('@')[0] || 
                             `Client ${client.id.slice(0, 8)}`;
          
          // Use auth_user_id if available, otherwise use client ID for display only
          const contactId = client.auth_user_id || client.id;
          const canMessage = !!client.auth_user_id; // Can only message if they have auth setup
          
          contacts.push({
            id: contactId,
            name: displayName,
            avatar: `${firstName.charAt(0) || 'C'}${lastName.charAt(0) || 'L'}`,
            type: 'client' as const,
            status: canMessage ? 'online' as const : 'offline' as const, // Show offline if no auth
            unread: 0,
            email: client.email,
            role: 'client',
            branchName: undefined,
            canMessage // Flag to indicate if messaging is possible
          });
        }
      }

      // Get carers for these branches - with organization filter
      // Include ALL carers (remove status filter to show all available carers)
      const { data: carers, error: carerError } = await supabase
        .from('staff')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          auth_user_id,
          branch_id,
          status,
          branches!inner (
            id,
            organization_id
          )
        `)
        .in('branch_id', branchIds)
        .eq('branches.organization_id', organization.id);

      if (carerError) {
        console.error('[useAdminContacts] Error fetching carers:', carerError);
      }

      console.log('[useAdminContacts] Carers found:', carers?.length || 0);
      if (carers) {
        for (const carer of carers) {
          
          const firstName = carer.first_name || '';
          const lastName = carer.last_name || '';
          const displayName = `${firstName} ${lastName}`.trim() || 
                             carer.email?.split('@')[0] || 
                             `Carer ${carer.id.slice(0, 8)}`;
          
          // Use auth_user_id if available, otherwise use staff ID for display only  
          const contactId = carer.auth_user_id || carer.id;
          const canMessage = !!carer.auth_user_id; // Can only message if they have auth setup
          
          contacts.push({
            id: contactId,
            name: displayName,
            avatar: `${firstName.charAt(0) || 'C'}${lastName.charAt(0) || 'R'}`,
            type: 'carer' as const,
            status: canMessage ? 'online' as const : 'offline' as const, // Show offline if no auth
            unread: 0,
            email: carer.email,
            role: 'carer',
            branchName: undefined,
            canMessage // Flag to indicate if messaging is possible
          });
        }
      }

      // Get admin users for messaging - WITHIN CURRENT ORGANIZATION ONLY
      if (currentUser.role === 'super_admin') {
        // Get admin users who have access to branches in current organization only
        const { data: orgAdminBranches } = await supabase
          .from('admin_branches')
          .select(`
            admin_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branches.organization_id', organization.id)
          .neq('admin_id', currentUser.id);

        const orgAdminIds = [...new Set(orgAdminBranches?.map(ab => ab.admin_id) || [])];
        
        const { data: allAdmins } = await supabase
          .from('user_roles')
          .select(`
            user_id,
            role
          `)
          .in('role', ['super_admin', 'branch_admin'])
          .in('user_id', orgAdminIds);

        console.log('[useAdminContacts] Admin roles found for super admin:', allAdmins?.length || 0);
        
        if (allAdmins && allAdmins.length > 0) {
          // Get profile details for these admin users
          const adminUserIds = allAdmins.map(a => a.user_id);
          const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', adminUserIds);

           if (adminProfiles) {
            adminProfiles.forEach(admin => {
              const adminRole = allAdmins.find(r => r.user_id === admin.id);
              const firstName = admin.first_name || '';
              const lastName = admin.last_name || '';
              const displayName = `${firstName} ${lastName}`.trim() || 
                                 admin.email?.split('@')[0] || 
                                 `Admin ${admin.id.slice(0, 8)}`;
              
               contacts.push({
                 id: admin.id,
                 name: displayName,
                 avatar: `${firstName.charAt(0) || 'A'}${lastName.charAt(0) || 'D'}`,
                 type: adminRole?.role === 'super_admin' ? 'super_admin' as const : 'branch_admin' as const,
                 status: 'online' as const,
                 unread: 0,
                 email: admin.email,
                 role: adminRole?.role || 'branch_admin',
                 branchName: undefined,
                 canMessage: true // Admins can always be messaged
               });
            });
          }
        }
      } else if (currentUser.role === 'branch_admin') {
        // Branch admin can message super admins and other branch admins WITHIN SAME ORGANIZATION
        
        // Get super admins who have access to current organization
        const { data: orgSuperAdminBranches } = await supabase
          .from('admin_branches')
          .select(`
            admin_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .eq('branches.organization_id', organization.id);

        const orgSuperAdminIds = [...new Set(orgSuperAdminBranches?.map(ab => ab.admin_id) || [])];
        
        const { data: superAdminRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'super_admin')
          .in('user_id', orgSuperAdminIds);

        if (superAdminRoles && superAdminRoles.length > 0) {
          const superAdminIds = superAdminRoles.map(r => r.user_id);
          const { data: superAdminProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', superAdminIds);

           console.log('[useAdminContacts] Super admin profiles found:', superAdminProfiles?.length || 0);
           if (superAdminProfiles) {
             superAdminProfiles.forEach(admin => {
               const firstName = admin.first_name || '';
               const lastName = admin.last_name || '';
               const displayName = `${firstName} ${lastName}`.trim() || 
                                  admin.email?.split('@')[0] || 
                                  `Super Admin ${admin.id.slice(0, 8)}`;
               
                contacts.push({
                  id: admin.id,
                  name: displayName,
                  avatar: `${firstName.charAt(0) || 'S'}${lastName.charAt(0) || 'A'}`,
                  type: 'super_admin' as const,
                  status: 'online' as const,
                  unread: 0,
                  email: admin.email,
                  role: 'super_admin',
                  branchName: undefined,
                  canMessage: true // Admins can always be messaged
                });
             });
           }
        }

        // Get other branch admins within same organization
        const { data: sharedBranchAdmins } = await supabase
          .from('admin_branches')
          .select(`
            admin_id,
            branches!inner (
              id,
              organization_id
            )
          `)
          .in('branch_id', branchIds)
          .eq('branches.organization_id', organization.id)
          .neq('admin_id', currentUser.id);

        if (sharedBranchAdmins && sharedBranchAdmins.length > 0) {
          // Remove duplicates and get profile details
          const uniqueAdminIds = [...new Set(sharedBranchAdmins.map(item => item.admin_id))];
          const { data: branchAdminProfiles } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', uniqueAdminIds);

          console.log('[useAdminContacts] Branch admin profiles found:', branchAdminProfiles?.length || 0);
          if (branchAdminProfiles) {
            branchAdminProfiles.forEach(admin => {
              const firstName = admin.first_name || '';
              const lastName = admin.last_name || '';
              const displayName = `${firstName} ${lastName}`.trim() || 
                                 admin.email?.split('@')[0] || 
                                 `Branch Admin ${admin.id.slice(0, 8)}`;
              
               contacts.push({
                 id: admin.id,
                 name: displayName,
                 avatar: `${firstName.charAt(0) || 'B'}${lastName.charAt(0) || 'A'}`,
                 type: 'branch_admin' as const,
                 status: 'online' as const,
                 unread: 0,
                 email: admin.email,
                 role: 'branch_admin',
                 branchName: undefined,
                 canMessage: true // Admins can always be messaged
               });
            });
          }
        }
      }

      // Filter out the current user from contacts to prevent self-messaging
      const filteredContacts = contacts.filter(contact => contact.id !== currentUser.id);
      
      console.log('[useAdminContacts] Total contacts found:', filteredContacts.length, '(excluding current user)');
      return filteredContacts.sort((a, b) => a.name.localeCompare(b.name));
      
      } catch (error) {
        console.error('[useAdminContacts] Error fetching contacts:', error);
        throw new Error(`Failed to load contacts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    enabled: !!currentUser && !!organization,
    staleTime: 300000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

// Get admin message threads (wrapper around unified system)
export const useAdminMessageThreads = () => {
  const { data: threads = [], isLoading, error } = useUnifiedMessageThreads();
  
  // Transform unified threads to admin-specific format
  const adminThreads: AdminMessageThread[] = threads.map(thread => ({
    id: thread.id,
    subject: thread.subject,
    participants: thread.participants.map(p => ({
      ...p,
      type: p.type === 'carer' ? 'carer' as const : 
            p.type === 'client' ? 'client' as const : 'branch_admin' as const
    })),
    lastMessage: thread.lastMessage ? {
      ...thread.lastMessage,
    } : undefined,
    unreadCount: thread.unreadCount,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    threadType: thread.threadType,
    requiresAction: thread.requiresAction,
    adminOnly: thread.adminOnly
  }));

  return {
    data: adminThreads,
    isLoading,
    error
  };
};

// Get messages for a specific thread (wrapper around unified system)
export const useAdminThreadMessages = (threadId: string) => {
  const { data: messages = [], isLoading, error } = useUnifiedThreadMessages(threadId);
  
  // Transform to admin format with metadata
  const adminMessages = messages.map(message => ({
    ...message,
    messageType: message.messageType,
    priority: message.priority, 
    actionRequired: message.actionRequired,
    adminEyesOnly: message.adminEyesOnly,
    notificationMethods: message.notificationMethods
  }));
  
  return { data: adminMessages, isLoading, error };
};

// Send message (wrapper around unified system)
export const useAdminSendMessage = () => {
  return useUnifiedSendMessage();
};

// Create thread (wrapper around unified system)
export const useAdminCreateThread = () => {
  return useUnifiedCreateThread();
};

// Legacy hook for backward compatibility with existing admin message components
export const useMessages = () => {
  const { data: threads = [] } = useAdminMessageThreads();
  
  // Transform to legacy format if needed
  const legacyMessages = threads.map(thread => ({
    id: thread.id,
    subject: thread.subject,
    sender: thread.participants[0]?.name || 'Unknown',
    preview: thread.lastMessage?.content || 'No messages',
    timestamp: thread.lastMessage?.timestamp || new Date(thread.createdAt),
    isRead: thread.unreadCount === 0,
    priority: 'medium' as const,
    category: 'general' as const
  }));

  return {
    data: legacyMessages,
    isLoading: false,
    error: null
  };
};

// Send message using legacy format (for backward compatibility)
export const useSendMessage = () => {
  const createThread = useAdminCreateThread();
  const sendMessage = useAdminSendMessage();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recipients, 
      subject, 
      content, 
      threadId 
    }: { 
      recipients: string[]; 
      subject: string; 
      content: string; 
      threadId?: string; 
    }) => {
      if (threadId) {
        // Reply to existing thread
        return await sendMessage.mutateAsync({
          threadId,
          content
        });
      } else {
        // Create new thread
        // For legacy compatibility, we'll just use the first recipient
        if (recipients.length === 0) {
          throw new Error('No recipients specified');
        }

        // Get recipient details from admin contacts
        const contacts = await queryClient.fetchQuery({
          queryKey: ['admin-contacts'],
          queryFn: async () => {
            // This will be populated by useAdminContacts
            return [];
          }
        }) || [];

        const recipientData = recipients.map(recipientId => {
          const contact = Array.isArray(contacts) ? contacts.find((c: any) => c.id === recipientId) : null;
          return {
            id: recipientId,
            name: contact?.name || 'Unknown',
            type: contact?.type || 'client'
          };
        });

        return await createThread.mutateAsync({
          recipientIds: recipientData.map(r => r.id),
          recipientNames: recipientData.map(r => r.name),
          recipientTypes: recipientData.map(r => r.type),
          subject,
          initialMessage: content
        });
      }
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      console.error('Send message error:', error);
      toast.error(`Failed to send message: ${error.message}`);
    }
  });
};
