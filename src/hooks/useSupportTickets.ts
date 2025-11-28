import { useUnifiedMessageThreads } from './useUnifiedMessaging';
import { useMemo } from 'react';

export interface SupportTicket {
  id: string;
  subject: string;
  clientName: string;
  clientId: string;
  status: 'unread' | 'read';
  priority: string;
  lastMessage: {
    content: string;
    timestamp: Date;
    senderName: string;
  } | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export const useSupportTickets = () => {
  const { data: threads = [], isLoading, error } = useUnifiedMessageThreads();

  const supportTickets = useMemo(() => {
    // Filter for support threads only
    return threads
      .filter(thread => thread.threadType === 'support')
      .map(thread => {
        // Find the client participant
        const clientParticipant = thread.participants.find(p => p.type === 'client');
        
        return {
          id: thread.id,
          subject: thread.subject.replace('Support - ', '').replace('Support Request - ', ''),
          clientName: clientParticipant?.name || 'Unknown Client',
          clientId: clientParticipant?.id || '',
          status: thread.unreadCount > 0 ? 'unread' : 'read',
          priority: thread.lastMessage?.priority || 'normal',
          lastMessage: thread.lastMessage ? {
            content: thread.lastMessage.content,
            timestamp: thread.lastMessage.timestamp,
            senderName: thread.lastMessage.senderName
          } : null,
          unreadCount: thread.unreadCount,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt
        } as SupportTicket;
      })
      .sort((a, b) => {
        // Sort unread first, then by date
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [threads]);

  return {
    data: supportTickets,
    isLoading,
    error
  };
};
