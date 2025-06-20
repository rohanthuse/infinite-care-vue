
import React, { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, ArrowRight, MoreHorizontal, Reply, 
  Download, Paperclip
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useThreadMessages } from "@/hooks/useMessages";
import { useUserRole } from "@/hooks/useUserRole";

interface MessageViewProps {
  messageId: string; // This is actually threadId
  onReply: () => void;
}

// Helper function to safely parse attachments
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

export const MessageView = ({ messageId: threadId, onReply }: MessageViewProps) => {
  const { data: messages = [], isLoading } = useThreadMessages(threadId);
  const { data: currentUser } = useUserRole();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-gray-400 text-lg mb-2">Loading messages...</div>
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

  const getTypeBadge = (senderType: string) => {
    switch (senderType) {
      case 'client':
        return (
          <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-green-50 text-green-700 border-green-200">
            Client
          </Badge>
        );
      case 'carer':
        return (
          <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
            Carer
          </Badge>
        );
      case 'super_admin':
      case 'branch_admin':
        return (
          <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      default:
        return null;
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Mark as unread</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const attachmentsList = parseAttachments(message.attachments);
          
          return (
            <div key={message.id} className="mb-6">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-gray-200">
                    {message.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="font-medium">
                      {message.senderId === currentUser?.id ? "You" : message.senderName}
                    </div>
                    
                    {getTypeBadge(message.senderType)}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {format(new Date(message.createdAt), "MMMM d, yyyy, h:mm a")}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 ml-13 text-sm whitespace-pre-line">
                {message.content}
              </div>
              
              {/* Attachments */}
              {message.hasAttachments && attachmentsList.length > 0 && (
                <div className="mt-3 ml-13 border-t border-gray-100 pt-3">
                  <div className="text-sm font-medium mb-2">
                    Attachments ({attachmentsList.length})
                  </div>
                  <div className="space-y-2">
                    {attachmentsList.map((attachment: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50"
                      >
                        <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{attachment.name || 'Attachment'}</div>
                          <div className="text-xs text-gray-500">{attachment.size || 'Unknown size'}</div>
                        </div>
                        <Button variant="ghost" size="icon" title="Download attachment">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <Button className="w-full" onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>
    </div>
  );
};
