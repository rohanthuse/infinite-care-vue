
import React, { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, MoreHorizontal, Reply, Download, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useClientThreadMessages } from "@/hooks/useClientMessaging";
import { useMarkMessagesAsRead } from "@/hooks/useUnifiedMessaging";
import { useUserRole } from "@/hooks/useUserRole";

interface ClientMessageViewProps {
  messageId: string; // This is actually threadId
  onReply: () => void;
}

export const ClientMessageView = ({ messageId: threadId, onReply }: ClientMessageViewProps) => {
  const { data: messages = [], isLoading, error } = useClientThreadMessages(threadId);
  const { data: currentUser } = useUserRole();
  const markMessagesAsRead = useMarkMessagesAsRead();

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    const container = document.getElementById('client-messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when they load
  useEffect(() => {
    if (messages.length === 0 || !currentUser) return;
    
    // Get all message IDs that are not from the current user and are unread
    const messageIdsToMarkAsRead = messages
      .filter(msg => msg.senderId !== currentUser.id && !msg.isRead)
      .map(msg => msg.id);
    
    if (messageIdsToMarkAsRead.length > 0) {
      markMessagesAsRead.mutate({ messageIds: messageIdsToMarkAsRead });
    }
  }, [messages, currentUser, markMessagesAsRead]);
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-gray-400 text-lg mb-2">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-red-400 text-lg mb-2">Error loading messages</div>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-gray-400 text-lg mb-2">No messages found</div>
        <p className="text-sm text-gray-500 max-w-md text-center">
          Start the conversation by sending a message.
        </p>
        <Button variant="outline" className="mt-4" onClick={onReply}>
          Send Message
        </Button>
      </div>
    );
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return format(timestamp, 'MMM d, h:mm a');
    }
  };

  const getTypeBadge = (senderType: string) => {
    switch (senderType) {
      case 'carer':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Carer
          </Badge>
        );
      case 'super_admin':
      case 'branch_admin':
        return (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      default:
        return null;
    }
  };

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
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold truncate">Conversation</h2>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Previous">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Next">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <div id="client-messages-container" className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderType === 'client';
          const attachmentsList = parseAttachments(message.attachments);
          const showAvatar = !isCurrentUser && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId ||
            (new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp).getTime()) > 300000 // 5 minutes
          );
          
          return (
            <div
              key={message.id}
              className={cn(
                "flex",
                isCurrentUser ? "justify-end" : "justify-start",
                showAvatar && !isCurrentUser ? "mt-4" : "mt-1"
              )}
            >
              <div className={cn(
                "flex space-x-2 max-w-[70%]",
                isCurrentUser ? "flex-row-reverse space-x-reverse" : ""
              )}>
                {showAvatar && !isCurrentUser && (
                  <Avatar className="h-8 w-8 mt-auto">
                    <AvatarFallback className="text-xs bg-muted">
                      {message.senderName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  showAvatar && !isCurrentUser ? "" : "ml-10",
                  isCurrentUser ? "mr-0" : ""
                )}>
                  {showAvatar && !isCurrentUser && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-foreground">{message.senderName}</span>
                      {getTypeBadge(message.senderType)}
                      <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2 shadow-sm",
                      isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground border border-border"
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {isCurrentUser && (
                      <div className="flex items-center justify-end mt-1 opacity-70">
                        <span className="text-xs">{formatTimestamp(message.timestamp)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Attachments */}
                  {message.hasAttachments && attachmentsList.length > 0 && (
                    <div className={cn(
                      "mt-2 space-y-2",
                      isCurrentUser ? "items-end" : "items-start"
                    )}>
                      {attachmentsList.map((attachment: any, attachIndex: number) => (
                        <div 
                          key={attachIndex}
                          className={cn(
                            "flex items-center p-2 border rounded-md bg-muted/50 max-w-xs",
                            isCurrentUser ? "ml-auto" : "mr-auto"
                          )}
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground mr-2" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{attachment.name || 'Attachment'}</div>
                            <div className="text-xs text-muted-foreground">{attachment.size || 'Unknown size'}</div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Download attachment">
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border bg-background">
        <Button className="w-full" onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>
    </div>
  );
};
