
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { toast } from 'sonner';

// Mock care team data - replace with actual Supabase queries when ready
const mockCareTeam = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@company.org",
    type: "admin",
    avatar: "SJ",
    status: "online" as const,
    unread: 2
  },
  {
    id: "2", 
    name: "Michael Chen",
    email: "michael.chen@company.org",
    type: "admin",
    avatar: "MC",
    status: "away" as const,
    unread: 0
  }
];

// Get client's care team (admins they can message)
export const useClientCareTeam = () => {
  const { clientProfile } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-care-team', clientProfile?.id],
    queryFn: async () => {
      // For now, return mock data
      // Later, query actual admins/care coordinators assigned to this client
      return mockCareTeam;
    },
    enabled: !!clientProfile?.id,
    staleTime: 300000, // 5 minutes
  });
};

// Get client's message threads
export const useClientMessageThreads = (contactId?: string | null) => {
  const { clientProfile } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-message-threads', clientProfile?.id, contactId],
    queryFn: async () => {
      if (!clientProfile?.id) return [];
      
      // Mock data for now
      return [
        {
          id: "thread-1",
          subject: "Care Plan Review",
          lastMessage: "I've reviewed your care plan and have some updates...",
          lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          participantName: "Dr. Sarah Johnson",
          participantAvatar: "SJ",
          unreadCount: 1,
          status: "active"
        },
        {
          id: "thread-2", 
          subject: "Appointment Confirmation",
          lastMessage: "Your appointment has been confirmed for tomorrow at 2 PM",
          lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          participantName: "Michael Chen",
          participantAvatar: "MC", 
          unreadCount: 0,
          status: "active"
        }
      ];
    },
    enabled: !!clientProfile?.id,
  });
};

// Get messages in a thread
export const useClientThreadMessages = (threadId: string | null) => {
  const { clientProfile } = useClientAuth();
  
  return useQuery({
    queryKey: ['client-thread-messages', threadId, clientProfile?.id],
    queryFn: async () => {
      if (!threadId || !clientProfile?.id) return [];
      
      // Mock data for now
      return [
        {
          id: "msg-1",
          content: "Hello! I wanted to discuss your upcoming care plan review. Are you available this week?",
          sentAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          sentBy: "admin",
          senderName: "Dr. Sarah Johnson",
          senderAvatar: "SJ",
          isRead: true
        },
        {
          id: "msg-2",
          content: "Yes, I'm available Tuesday or Wednesday afternoon. What time works best?",
          sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          sentBy: "client",
          senderName: clientProfile.first_name,
          senderAvatar: clientProfile.first_name.charAt(0),
          isRead: true
        },
        {
          id: "msg-3",
          content: "Perfect! Let's schedule for Wednesday at 2 PM. I'll send you the meeting link shortly.",
          sentAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          sentBy: "admin", 
          senderName: "Dr. Sarah Johnson",
          senderAvatar: "SJ",
          isRead: false
        }
      ];
    },
    enabled: !!threadId && !!clientProfile?.id,
  });
};

// Create new message thread
export const useClientCreateThread = () => {
  const queryClient = useQueryClient();
  const { clientProfile } = useClientAuth();

  return useMutation({
    mutationFn: async ({ recipientId, recipientName, recipientType, subject, initialMessage }: {
      recipientId: string;
      recipientName: string;
      recipientType: string;
      subject: string;
      initialMessage: string;
    }) => {
      if (!clientProfile?.id) throw new Error('Client not authenticated');

      // Mock implementation - replace with actual Supabase calls
      console.log('Creating thread:', { recipientId, recipientName, subject, initialMessage });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        id: `thread-${Date.now()}`,
        subject,
        recipientId,
        recipientName,
        createdAt: new Date()
      };
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

// Send message to existing thread
export const useClientSendMessage = () => {
  const queryClient = useQueryClient();
  const { clientProfile } = useClientAuth();

  return useMutation({
    mutationFn: async ({ threadId, content }: {
      threadId: string;
      content: string;
    }) => {
      if (!clientProfile?.id) throw new Error('Client not authenticated');

      // Mock implementation - replace with actual Supabase calls
      console.log('Sending message to thread:', threadId, content);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id: `msg-${Date.now()}`,
        threadId,
        content,
        sentAt: new Date()
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-thread-messages', data.threadId] });
      queryClient.invalidateQueries({ queryKey: ['client-message-threads'] });
      toast.success('Message sent');
    },
    onError: (error) => {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    }
  });
};
