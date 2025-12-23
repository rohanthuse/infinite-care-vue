
import React, { useEffect } from "react";
import { format } from "date-fns";
import { Plus, Search, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useClientMessageThreads } from "@/hooks/useClientMessaging";

interface ClientMessageListProps {
  selectedContactId: string | null;
  selectedMessageId: string | null;
  onMessageSelect: (messageId: string) => void;
  onComposeClick: () => void;
  searchTerm: string;
  isComposing?: boolean;
}

export const ClientMessageList = ({ 
  selectedContactId, 
  selectedMessageId,
  onMessageSelect,
  onComposeClick,
  searchTerm,
  isComposing = false
}: ClientMessageListProps) => {
  const { data: threads = [], isLoading, error } = useClientMessageThreads();
  
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
    const hasAdmin = participants.some(p => p.type === 'admin');
    const hasCarer = participants.some(p => p.type === 'carer');

    if (hasAdmin && hasCarer) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
          Care Team
        </Badge>
      );
    } else if (hasAdmin) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
          Admin
        </Badge>
      );
    } else if (hasCarer) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
          Carer
        </Badge>
      );
    }
    return null;
  };
  
  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-border flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Messages</h3>
        <Button
          size="sm"
          className="gap-1"
          onClick={onComposeClick}
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Button>
      </div>
      
      <div className="p-3 border-b border-gray-200 dark:border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-gray-50 dark:bg-muted"
            value={searchTerm}
            readOnly
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500 dark:text-muted-foreground">
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
                "p-3 hover:bg-gray-50 dark:hover:bg-muted/50 cursor-pointer border-b border-gray-100 dark:border-border transition-colors",
                selectedMessageId === thread.id ? "bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/30" : "",
                thread.unreadCount > 0 ? "bg-gray-50 dark:bg-muted/50" : ""
              )}
              onClick={() => onMessageSelect(thread.id)}
            >
              <div className="flex items-start">
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-muted flex items-center justify-center text-sm font-medium shrink-0 text-foreground">
                  {thread.participants[0]?.avatar || 'T'}
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
                    
                    <span className="text-xs text-gray-500 dark:text-muted-foreground">
                      {thread.lastMessage ? formatMessageDate(thread.lastMessage.timestamp) : ''}
                    </span>
                  </div>
                  
                  <div className={cn(
                    "text-sm truncate",
                    thread.unreadCount > 0 ? "font-medium text-foreground" : "text-gray-700 dark:text-foreground"
                  )}>
                    {thread.subject}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-muted-foreground truncate mt-1">
                      {thread.lastMessage ? (
                        `${thread.lastMessage.senderName}: ${thread.lastMessage.content}`
                      ) : 'No messages yet'}
                    </p>
                    
                    {thread.lastMessage?.hasAttachments && (
                      <FileText className="h-3 w-3 text-gray-400 dark:text-muted-foreground ml-1 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-muted-foreground">
            {selectedContactId ? 
              "No messages with this contact" : 
              "No messages found"
            }
          </div>
        )}
      </div>
    </>
  );
};
