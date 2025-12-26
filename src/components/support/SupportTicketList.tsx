import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Clock, AlertTriangle } from 'lucide-react';
import { SupportTicket } from '@/hooks/useSupportTickets';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicketListProps {
  tickets: SupportTicket[];
  selectedTicketId: string | null;
  onTicketSelect: (ticketId: string) => void;
  isLoading: boolean;
}

export const SupportTicketList: React.FC<SupportTicketListProps> = ({
  tickets,
  selectedTicketId,
  onTicketSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
        <p>No support tickets found</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {tickets.map((ticket) => (
        <div
          key={ticket.id}
          onClick={() => onTicketSelect(ticket.id)}
          className={`p-4 cursor-pointer transition-colors hover:bg-accent ${
            selectedTicketId === ticket.id ? 'bg-accent border-l-4 border-l-primary' : ''
          } ${ticket.unreadCount > 0 ? 'bg-accent/30' : ''}`}
        >
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {ticket.clientName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={`font-medium text-sm truncate ${
                  ticket.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {ticket.clientName}
                </span>
                <div className="flex items-center gap-2">
                  {ticket.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {ticket.unreadCount}
                    </Badge>
                  )}
                  {ticket.priority === 'high' && (
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  )}
                </div>
              </div>

              <h4 className={`text-sm truncate mb-1 ${
                ticket.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
              }`}>
                {ticket.subject}
              </h4>

              {ticket.lastMessage && (
                <p className="text-xs text-muted-foreground truncate">
                  {ticket.lastMessage.senderName}: {ticket.lastMessage.content}
                </p>
              )}

              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {ticket.lastMessage 
                    ? formatDistanceToNow(ticket.lastMessage.timestamp, { addSuffix: true })
                    : formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    ticket.unreadCount > 0 
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' 
                      : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700'
                  }`}
                >
                  {ticket.unreadCount > 0 ? 'Unread' : 'Read'}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
