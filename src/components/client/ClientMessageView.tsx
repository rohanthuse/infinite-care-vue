
import React, { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight, MoreHorizontal, Clock, AlertTriangle, Eye, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useClientThreadMessages } from "@/hooks/useClientMessaging";
import { useMarkMessagesAsRead } from "@/hooks/useUnifiedMessaging";
import { useUserRole } from "@/hooks/useUserRole";
import { MessageAttachmentViewer } from "@/components/communications/MessageAttachmentViewer";
import { useMessageAttachments } from "@/hooks/useMessageAttachments";
import { MessageReadReceipt } from "@/components/communications/MessageReadReceipt";
import { ClientMessageInputBar } from "./ClientMessageInputBar";

interface ClientMessageViewProps {
  messageId: string; // This is actually threadId
}

export const ClientMessageView = ({ messageId: threadId }: ClientMessageViewProps) => {
  const { data: messages = [], isLoading, error } = useClientThreadMessages(threadId);
  const { data: currentUser } = useUserRole();
  const markMessagesAsRead = useMarkMessagesAsRead();
  const { downloadAttachment, previewAttachment } = useMessageAttachments();

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
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
          <div className="text-gray-400 text-lg mb-2">No messages yet</div>
          <p className="text-sm text-gray-500 max-w-md text-center">
            Start the conversation by sending a message below.
          </p>
        </div>
        <ClientMessageInputBar threadId={threadId} />
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

  const getMessageTypeColor = (type?: string) => {
    switch (type) {
      case 'incident':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'emergency':
        return 'bg-red-100 text-red-800 border-red-900';
      case 'shift':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'general':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeBadge = (senderType: string) => {
    switch (senderType) {
      case 'carer':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <User className="h-3 w-3 mr-1" />
            Carer
          </Badge>
        );
      case 'super_admin':
      case 'branch_admin':
        return (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Users className="h-3 w-3 mr-1" />
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
      <div id="client-messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                    <AvatarFallback className="text-xs">
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
                      <span className="text-sm font-medium text-gray-700">{message.senderName}</span>
                      {getTypeBadge(message.senderType)}
                      <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  )}
                  
                  <div
                    className={cn(
                      "rounded-lg px-4 py-2",
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    )}
                  >
                    {/* Message Type and Priority Badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {message.messageType && (
                        <Badge variant="secondary" className={`text-xs ${getMessageTypeColor(message.messageType)}`}>
                          {message.messageType.charAt(0).toUpperCase() + message.messageType.slice(1)}
                        </Badge>
                      )}
                      {message.priority && message.priority !== 'normal' && (
                        <Badge variant="secondary" className={`text-xs ${getPriorityColor(message.priority)}`}>
                          {message.priority.charAt(0).toUpperCase() + message.priority.slice(1)} Priority
                        </Badge>
                      )}
                      {message.actionRequired && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Action Required
                        </Badge>
                      )}
                      {message.adminEyesOnly && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200">
                          <Eye className="h-3 w-3 mr-1" />
                          Admin Only
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Attachments */}
                    {message.hasAttachments && attachmentsList.length > 0 && (
                      <div className="mt-2">
                         <MessageAttachmentViewer 
                           attachments={attachmentsList}
                           onPreview={previewAttachment}
                           onDownload={downloadAttachment}
                         />
                      </div>
                    )}
                    
                    {isCurrentUser && (
                      <div className="flex items-center justify-end mt-1 space-x-2">
                        <Clock className="h-3 w-3 opacity-70" />
                        <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
                        <MessageReadReceipt
                          messageId={message.id}
                          senderId={message.senderId}
                          threadId={threadId}
                          isCurrentUserSender={isCurrentUser}
                          className="opacity-70"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Inline Chat Input Bar */}
      <ClientMessageInputBar threadId={threadId} />
    </div>
  );
};
