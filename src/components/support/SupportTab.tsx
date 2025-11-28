import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageCircle } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';
import { SupportTicketList } from './SupportTicketList';
import { SupportConversationView } from './SupportConversationView';

interface SupportTabProps {
  branchId?: string;
  branchName?: string;
}

export const SupportTab: React.FC<SupportTabProps> = ({ branchId, branchName }) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  
  const { data: tickets = [], isLoading, error } = useSupportTickets();

  // Filter tickets based on search and status
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = !searchTerm || 
      ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'unread' && ticket.unreadCount > 0) ||
      (statusFilter === 'read' && ticket.unreadCount === 0);
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalTickets = tickets.length;
  const unreadTickets = tickets.filter(t => t.unreadCount > 0).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      {/* Left Panel - Ticket List */}
      <div className="w-1/3 border-r border-border flex flex-col">
        {/* Header with Stats */}
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-primary" />
            Support Tickets
          </h2>
          <div className="flex gap-4 mt-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="ml-1 font-medium text-foreground">{totalTickets}</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Unread:</span>
              <Badge variant="secondary" className="ml-1 bg-destructive/10 text-destructive">
                {unreadTickets}
              </Badge>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'unread' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('unread')}
            >
              Unread
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'read' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('read')}
            >
              Read
            </Button>
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          <SupportTicketList
            tickets={filteredTickets}
            selectedTicketId={selectedTicketId}
            onTicketSelect={setSelectedTicketId}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Right Panel - Conversation View */}
      <div className="flex-1 flex flex-col">
        {selectedTicketId ? (
          <SupportConversationView
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
            <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground text-lg">Select a ticket to view conversation</p>
            <p className="text-muted-foreground/70 text-sm mt-2">
              Click on any support ticket from the list to view and respond
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
