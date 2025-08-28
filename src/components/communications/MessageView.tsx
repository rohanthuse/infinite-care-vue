import React, { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reply, Users, User, Clock, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { useAdminThreadMessages } from "@/hooks/useAdminMessaging";
import { useUserRole } from "@/hooks/useUserRole";
import { useMarkMessagesAsRead } from "@/hooks/useUnifiedMessaging";
import { useThreadParticipants } from "@/hooks/useThreadParticipants";
import { MessageAttachmentViewer } from "./MessageAttachmentViewer";

interface MessageViewProps {
  messageId: string;
  onReply: () => void;
}

export const MessageView = ({ messageId, onReply }: MessageViewProps) => {
  const { data: currentUser } = useUserRole();
  const { data: messages = [], isLoading, error } = useAdminThreadMessages(messageId);
  const { data: threadParticipants = [] } = useThreadParticipants(messageId);
  const markMessagesAsRead = useMarkMessagesAsRead();

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when they load
  useEffect(() => {
    if (messages.length === 0 || !currentUser) return;
    
    // Get all message IDs that are not from the current user
    const messageIdsToMarkAsRead = messages
      .filter(msg => msg.senderId !== currentUser.id && !msg.isRead)
      .map(msg => msg.id);
    
    if (messageIdsToMarkAsRead.length > 0) {
      markMessagesAsRead.mutate({ messageIds: messageIdsToMarkAsRead });
    }
  }, [messages, currentUser, markMessagesAsRead]);

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
      return timestamp.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Use thread participants from the database instead of deriving from messages
  const participants = threadParticipants;
  const isGroupChat = participants.length > 2;
  
  // Get the other participant(s) excluding current user
  const otherParticipants = participants.filter(p => p.userId !== currentUser?.id);
  const displayName = isGroupChat 
    ? `Group Chat (${participants.length})`
    : otherParticipants[0]?.name || 'Unknown';
  
  const getAvatarInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">Loading conversation...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center">
            <p>Error loading messages</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 underline text-sm mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">No messages in this conversation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={isGroupChat ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}>
                {isGroupChat ? 'GR' : getAvatarInitials(otherParticipants[0]?.name || 'UN')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  {displayName}
                </h3>
                {isGroupChat && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700">
                    <Users className="h-3 w-3 mr-1" />
                    Group
                  </Badge>
                )}
              </div>
              {isGroupChat && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {participants.map(p => p.name).join(', ')}
                </p>
              )}
            </div>
          </div>
          
          <Button variant="outline" size="sm" onClick={onReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div id="messages-container" className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser?.id;
          const showAvatar = !isCurrentUser && (
            index === 0 || 
            messages[index - 1]?.senderId !== message.senderId ||
            (new Date(message.timestamp).getTime() - new Date(messages[index - 1]?.timestamp).getTime()) > 300000 // 5 minutes
          );
          
          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} ${
                showAvatar ? 'mt-4' : 'mt-1'
              }`}
            >
              <div className={`flex space-x-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                {showAvatar && !isCurrentUser && (
                  <Avatar className="h-8 w-8 mt-auto">
                    <AvatarFallback className="text-xs">
                      {message.senderName.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`${showAvatar && !isCurrentUser ? '' : 'ml-10'} ${isCurrentUser ? 'mr-0' : ''}`}>
                  {showAvatar && !isCurrentUser && (
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-700">{message.senderName}</span>
                      <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  )}
                  
                   <div
                     className={`rounded-lg px-4 py-2 ${
                       isCurrentUser
                         ? 'bg-blue-600 text-white'
                         : 'bg-white text-gray-900 border border-gray-200'
                     }`}
                   >
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
                      {message.hasAttachments && message.attachments && (
                        <div className="mt-2">
                          <MessageAttachmentViewer 
                            attachments={message.attachments}
                            onPreview={(attachment) => {
                              console.log('Preview attachment:', attachment);
                            }}
                            onDownload={(attachment) => {
                              console.log('Download attachment:', attachment);
                            }}
                          />
                        </div>
                      )}
                      
                      {isCurrentUser && (
                        <div className="flex items-center justify-end mt-1 space-x-1">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <Button variant="default" onClick={onReply}>
            <Reply className="h-4 w-4 mr-2" />
            Reply to conversation
          </Button>
        </div>
      </div>
    </div>
  );
};