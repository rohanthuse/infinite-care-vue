import React, { useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Reply, Users, User, Clock } from "lucide-react";
import { useAdminThreadMessages } from "@/hooks/useAdminMessaging";
import { useUserRole } from "@/hooks/useUserRole";

interface MessageViewProps {
  messageId: string;
  onReply: () => void;
}

export const MessageView = ({ messageId, onReply }: MessageViewProps) => {
  const { data: currentUser } = useUserRole();
  const { data: messages = [], isLoading, error } = useAdminThreadMessages(messageId);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

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

  const getParticipants = () => {
    if (!messages.length) return [];
    
    const participantMap = new Map();
    messages.forEach(message => {
      if (!participantMap.has(message.senderId)) {
        participantMap.set(message.senderId, {
          id: message.senderId,
          name: message.senderName,
          type: message.senderType
        });
      }
    });
    
    return Array.from(participantMap.values());
  };

  const participants = getParticipants();
  const isGroupChat = participants.length > 2;

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
                {isGroupChat ? 'GR' : participants[0]?.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'UN'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">
                  {isGroupChat ? `Group Chat (${participants.length})` : participants.find(p => p.id !== currentUser?.id)?.name || 'Unknown'}
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
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
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