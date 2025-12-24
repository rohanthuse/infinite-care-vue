
import React, { useEffect } from "react";
import { format } from "date-fns";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUnifiedMessageThreads } from "@/hooks/useUnifiedMessaging";

interface CarerMessageListProps {
  selectedContactId: string | null;
  selectedMessageId: string | null;
  onMessageSelect: (messageId: string) => void;
  onComposeClick: () => void;
  searchTerm: string;
  isComposing?: boolean;
}

export const CarerMessageList = ({ 
  selectedContactId, 
  selectedMessageId,
  onMessageSelect,
  onComposeClick,
  searchTerm,
  isComposing = false
}: CarerMessageListProps) => {
  const { data: threads = [], isLoading, error } = useUnifiedMessageThreads();
  
  // Filter threads based on selected contact and search term
  const filteredThreads = threads.filter(thread => {
    const matchesContact = !selectedContactId || 
                          thread.participants.some(p => p.id === selectedContactId);
    
    const matchesSearch = 
      thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (thread.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      thread.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesContact && matchesSearch;
  });

  // Auto-select first thread if none selected (only when not composing)
  useEffect(() => {
    if (!selectedMessageId && filteredThreads.length > 0 && !isComposing) {
      onMessageSelect(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedMessageId, onMessageSelect, isComposing]);
  
  const formatMessageDate = (date: Date) => {
    const now = new Date();
    const isToday = date.getDate() === now.getDate() &&
                   date.getMonth() === now.getMonth() &&
                   date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return format(date, "HH:mm");
    } else {
      return format(date, "dd MMM");
    }
  };

  const getParticipantNames = (participants: any[]) => {
    return participants.map(p => p.name).join(", ");
  };

  const getParticipantBadge = (participants: any[]) => {
    const hasClient = participants.some(p => p.type === 'client');
    const hasAdmin = participants.some(p => p.type === 'admin' || p.type === 'super_admin' || p.type === 'branch_admin');

    if (hasClient && hasAdmin) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
          Team
        </Badge>
      );
    } else if (hasClient) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          Client
        </Badge>
      );
    } else if (hasAdmin) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
          Admin
        </Badge>
      );
    }
    return null;
  };
  
  return (
    <>
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold">Messages</h3>
        <Button
          size="sm"
          className="gap-1"
          onClick={onComposeClick}
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Button>
      </div>
      
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-muted"
            value={searchTerm}
            readOnly
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-muted-foreground">
            Loading messages...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-500 dark:text-red-400">
            Error loading messages: {error.message}
          </div>
        ) : filteredThreads.length > 0 ? (
          filteredThreads.map((thread) => (
            <div 
              key={thread.id}
              className={cn(
                "p-3 hover:bg-muted cursor-pointer border-b border-border transition-colors",
                selectedMessageId === thread.id ? "bg-blue-50 hover:bg-blue-50 dark:bg-blue-950/50 dark:hover:bg-blue-950/50" : "",
                thread.unreadCount > 0 ? "bg-muted/50" : ""
              )}
              onClick={() => onMessageSelect(thread.id)}
            >
              <div className="flex items-start">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium shrink-0">
                  {thread.participants[0]?.name?.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'T'}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className={cn(
                        "font-medium text-sm truncate max-w-[150px]",
                        thread.unreadCount > 0 ? "font-semibold" : ""
                      )}>
                        {getParticipantNames(thread.participants)}
                      </span>
                      
                      {getParticipantBadge(thread.participants)}
                      
                      {thread.unreadCount > 0 && (
                        <div className="ml-2 bg-blue-600 text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                          {thread.unreadCount}
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      {thread.lastMessage ? formatMessageDate(thread.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "text-sm truncate",
                    thread.unreadCount > 0 ? "font-medium" : "text-foreground"
                  )}>
                    {thread.subject}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {thread.lastMessage ? (
                        `${thread.lastMessage.senderName}: ${thread.lastMessage.content}`
                      ) : 'No messages yet'}
                    </p>
                    
                    {thread.lastMessage?.hasAttachments && (
                      <FileText className="h-3 w-3 text-muted-foreground ml-1 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            {selectedContactId ? 
              "No messages with this client" : 
              "No messages found"
            }
          </div>
        )}
      </div>
    </>
  );
};
