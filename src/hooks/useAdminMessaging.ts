
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';
import { useUnifiedMessageThreads, useUnifiedThreadMessages, useUnifiedSendMessage, useUnifiedCreateThread } from './useUnifiedMessaging';

// Admin-specific interfaces that extend the unified system
export interface AdminContact {
  id: string;
  name: string;
  avatar: string;
  type: 'carer' | 'client' | 'admin';
  status: 'online' | 'offline' | 'away';
  unread: number;
  email?: string;
  role?: string;
  branchName?: string;
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
}

// Get contacts available for admin messaging (clients and carers in their branches)
export const useAdminContacts = () => {
  const { data: currentUser } = useUserRole();
  
  return useQuery({
    queryKey: ['admin-contacts', currentUser?.id],
    queryFn: async (): Promise<AdminContact[]> => {
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin')) {
        return [];
      }

      const contacts: AdminContact[] = [];

      // Get branch access for admin
      let branchIds: string[] = [];
      
      if (currentUser.role === 'super_admin') {
        // Super admin can see all branches
        const { data: branches } = await supabase
          .from('branches')
          .select('id, name');
        branchIds = branches?.map(b => b.id) || [];
      } else {
        // Regular admin - get their assigned branches
        const { data: adminBranches } = await supabase
          .from('admin_branches')
          .select('branch_id')
          .eq('admin_id', currentUser.id);
        branchIds = adminBranches?.map(ab => ab.branch_id) || [];
      }

      if (branchIds.length === 0) return [];

      // Get clients for these branches
      const { data: clients } = await supabase
        .from('clients')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          branch_id,
          branches!inner(name)
        `)
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
            role: 'client',
            branchName: client.branches?.name
          });
        });
      }

      // Get carers for these branches
      const { data: carers } = await supabase
        .from('staff')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          branch_id,
          branches!inner(name)
        `)
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
            role: 'carer',
            branchName: carer.branches?.name
          });
        });
      }

      return contacts.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin'),
    staleTime: 300000, // 5 minutes
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
      type: p.type as 'carer' | 'client' | 'admin'
    })),
    lastMessage: thread.lastMessage ? {
      ...thread.lastMessage,
    } : undefined,
    unreadCount: thread.unreadCount,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt
  }));

  return {
    data: adminThreads,
    isLoading,
    error
  };
};

// Get messages for a specific thread (wrapper around unified system)
export const useAdminThreadMessages = (threadId: string) => {
  return useUnifiedThreadMessages(threadId);
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

        // Get recipient details
        const { data: contacts } = await queryClient.fetchQuery({
          queryKey: ['admin-contacts'],
          queryFn: async () => {
            // This will be populated by useAdminContacts
            return [];
          }
        });

        const recipientData = recipients.map(recipientId => {
          const contact = contacts.find((c: any) => c.id === recipientId);
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
