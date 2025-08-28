
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientAuth } from "@/hooks/useClientAuth";
import { useTenant } from "@/contexts/TenantContext";
import { toast } from "sonner";

export interface CareTeamMember {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  type: "admin" | "carer";
  email: string;
  unread: number;
}

export interface MessageThread {
  id: string;
  subject: string;
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
    type: string;
  }>;
  lastMessage?: {
    content: string;
    timestamp: Date;
    senderName: string;
    hasAttachments?: boolean;
  };
  unreadCount: number;
  createdAt: Date;
}

export interface ThreadMessage {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderType: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: any;
  messageType?: string;
  priority?: string;
  actionRequired?: boolean;
  adminEyesOnly?: boolean;
}

export const useClientCareTeam = () => {
  const { clientId, branchId } = useClientAuth();
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['client-care-team', clientId, organization?.id],
    queryFn: async (): Promise<CareTeamMember[]> => {
      if (!clientId || !organization?.id) {
        console.log('[useClientCareTeam] Missing client ID or organization');
        return [];
      }

      console.log('[useClientCareTeam] Fetching care team for client:', clientId, 'org:', organization.id);

      const { data: careTeamData, error } = await supabase
        .rpc('get_client_care_team', { p_org_id: organization.id });

      if (error) {
        console.error('[useClientCareTeam] Error fetching care team:', error);
        throw error;
      }

      console.log('[useClientCareTeam] Raw care team data:', careTeamData);

      if (!careTeamData || careTeamData.length === 0) {
        console.log('[useClientCareTeam] No care team members found');
        return [];
      }

      // Transform the data into the expected format
      const careTeam: CareTeamMember[] = careTeamData.map((member: any) => {
        const initials = member.user_name
          ?.split(' ')
          .map((n: string) => n.charAt(0))
          .join('')
          .substring(0, 2)
          .toUpperCase() || '??';

        return {
          id: member.auth_user_id, // Use auth_user_id for messaging
          name: member.user_name || 'Team Member',
          avatar: initials,
          status: "offline" as const, // Default status - could be enhanced with real presence
          type: member.user_type as "admin" | "carer",
          email: member.email || '',
          unread: 0 // Default - could be enhanced with actual unread counts
        };
      });

      console.log('[useClientCareTeam] Processed care team:', careTeam);
      return careTeam;
    },
    enabled: !!clientId && !!organization?.id,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });
};

export const useClientMessageThreads = () => {
  const { clientId } = useClientAuth();
  const { organization } = useTenant();
  
  return useQuery({
    queryKey: ['client-message-threads', clientId, organization?.id],
    queryFn: async (): Promise<MessageThread[]> => {
      if (!clientId || !organization?.id) {
        return [];
      }

      const { data: threadsData, error } = await supabase
        .from('message_threads')
        .select(`
          *,
          message_participants!inner(
            user_id,
            user_name,
            user_type
          ),
          messages(
            id,
            sender_id,
            sender_name,
            content,
            created_at,
            has_attachments
          )
        `)
        .eq('message_participants.user_id', clientId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching message threads:', error);
        throw error;
      }

      return (threadsData || []).map((thread: any) => ({
        id: thread.id,
        subject: thread.subject,
        participants: thread.message_participants
          .filter((p: any) => p.user_id !== clientId)
          .map((p: any) => ({
            id: p.user_id,
            name: p.user_name,
            avatar: p.user_name?.split(' ').map((n: string) => n.charAt(0)).join('').substring(0, 2).toUpperCase() || '??',
            type: p.user_type
          })),
        lastMessage: thread.messages?.length > 0 ? {
          content: thread.messages[thread.messages.length - 1].content,
          timestamp: new Date(thread.messages[thread.messages.length - 1].created_at),
          senderName: thread.messages[thread.messages.length - 1].sender_name,
          hasAttachments: thread.messages[thread.messages.length - 1].has_attachments
        } : undefined,
        unreadCount: 0, // TODO: Calculate actual unread count
        createdAt: new Date(thread.created_at)
      }));
    },
    enabled: !!clientId && !!organization?.id,
    staleTime: 10000,
  });
};

export const useClientThreadMessages = (threadId: string) => {
  return useQuery({
    queryKey: ['client-thread-messages', threadId],
    queryFn: async (): Promise<ThreadMessage[]> => {
      if (!threadId) return [];

      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching thread messages:', error);
        throw error;
      }

      return (messagesData || []).map((msg: any) => ({
        id: msg.id,
        threadId: msg.thread_id,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderType: msg.sender_type,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isRead: msg.is_read || false,
        hasAttachments: msg.has_attachments || false,
        attachments: msg.attachments,
        messageType: msg.message_type,
        priority: msg.priority,
        actionRequired: msg.action_required,
        adminEyesOnly: msg.admin_eyes_only
      }));
    },
    enabled: !!threadId,
    staleTime: 5000,
  });
};

export const useClientCreateThread = () => {
  const queryClient = useQueryClient();
  const { clientId } = useClientAuth();
  const { organization } = useTenant();
  
  return useMutation({
    mutationFn: async ({
      recipientId,
      recipientName,
      recipientType,
      subject,
      initialMessage,
      attachments = []
    }: {
      recipientId: string;
      recipientName: string;
      recipientType: string;
      subject: string;
      initialMessage: string;
      attachments?: any[];
    }) => {
      if (!clientId || !organization?.id) {
        throw new Error('Client not authenticated or organization not found');
      }

      console.log('[useClientCreateThread] Creating thread:', {
        recipientId,
        recipientName,
        recipientType,
        subject,
        messageLength: initialMessage.length,
        attachmentsCount: attachments.length
      });

      // Create thread
      const { data: threadData, error: threadError } = await supabase
        .from('message_threads')
        .insert({
          subject,
          created_by: clientId,
          organization_id: organization.id
        })
        .select()
        .single();

      if (threadError) {
        console.error('[useClientCreateThread] Thread creation error:', threadError);
        throw threadError;
      }

      // Add participants
      const participants = [
        {
          thread_id: threadData.id,
          user_id: clientId,
          user_name: 'Client', // Will be updated by trigger
          user_type: 'client'
        },
        {
          thread_id: threadData.id,
          user_id: recipientId,
          user_name: recipientName,
          user_type: recipientType
        }
      ];

      const { error: participantsError } = await supabase
        .from('message_participants')
        .insert(participants);

      if (participantsError) {
        console.error('[useClientCreateThread] Participants error:', participantsError);
        throw participantsError;
      }

      // Send initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: threadData.id,
          sender_id: clientId,
          sender_name: 'Client', // Will be updated by trigger
          sender_type: 'client',
          content: initialMessage,
          has_attachments: attachments.length > 0,
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
        });

      if (messageError) {
        console.error('[useClientCreateThread] Message error:', messageError);
        throw messageError;
      }

      toast.success('Message sent successfully');
      return threadData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
    }
  });
};

export const useClientSendMessage = () => {
  const queryClient = useQueryClient();
  const { clientId } = useClientAuth();
  
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
      if (!clientId) {
        throw new Error('Client not authenticated');
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: threadId,
          sender_id: clientId,
          sender_name: 'Client', // Will be updated by trigger
          sender_type: 'client',
          content,
          has_attachments: attachments.length > 0,
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
        });

      if (error) {
        console.error('[useClientSendMessage] Error:', error);
        throw error;
      }

      toast.success('Reply sent successfully');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-thread-messages', variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
    }
  });
};
