import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, User, Clock, AlertTriangle, CheckCircle, Eye, Trash2, MoreVertical, Info, Pencil } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAdminThreadMessages } from "@/hooks/useAdminMessaging";
import { useUserRole } from "@/hooks/useUserRole";
import { useMarkMessagesAsRead } from "@/hooks/useUnifiedMessaging";
import { useThreadParticipants } from "@/hooks/useThreadParticipants";
import { MessageAttachmentViewer } from "./MessageAttachmentViewer";
import { useMessageAttachments } from "@/hooks/useMessageAttachments";
import { useDeleteMessage, useDeleteThread } from "@/hooks/useDeleteMessage";
import { ConfirmDeleteMessageDialog } from "./ConfirmDeleteMessageDialog";
import { forceModalCleanup } from "@/lib/modal-cleanup";
import { MessageReadReceipt } from "./MessageReadReceipt";
import { MessageInfoSheet } from "./MessageInfoSheet";
import { EditMessageDialog } from "./EditMessageDialog";
import { useEditMessage } from "@/hooks/useEditMessage";
import { MessageFollowUpView } from "./MessageFollowUpView";

interface MessageViewProps {
  messageId: string;
  onReply: () => void;
}

export const MessageView = ({ messageId, onReply }: MessageViewProps) => {
  const { data: currentUser } = useUserRole();
  const { data: messages = [], isLoading, error } = useAdminThreadMessages(messageId);
  const { data: threadParticipants = [] } = useThreadParticipants(messageId);
  const markMessagesAsRead = useMarkMessagesAsRead();
  const { downloadAttachment, previewAttachment, isDownloading, isPreviewing } = useMessageAttachments();
  const deleteMessage = useDeleteMessage();
  const deleteThread = useDeleteThread();
  const editMessage = useEditMessage();

  // State for delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    messageId?: string;
    threadId?: string;
    content?: string;
    type: 'message' | 'thread';
  }>({
    open: false,
    type: 'message'
  });

  // State for message info sheet
  const [messageInfoSheet, setMessageInfoSheet] = useState<{
    open: boolean;
    messageId?: string;
    threadId?: string;
  }>({ open: false });

  // State for edit dialog
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    messageId?: string;
    threadId?: string;
    content?: string;
    attachments?: any[];
  }>({ open: false });

  // Dropdown state management
  const [threadDropdownOpen, setThreadDropdownOpen] = useState(false);
  const [messageDropdownOpen, setMessageDropdownOpen] = useState<string | null>(null);

  // Check if user can delete (only admins)
  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';

  // Message info handler
  const handleMessageInfoClick = (msgId: string, threadId: string) => {
    setMessageDropdownOpen(null); // Close dropdown first
    setTimeout(() => {
      setMessageInfoSheet({
        open: true,
        messageId: msgId,
        threadId
      });
    }, 100);
  };

  // Edit handler
  const handleEditMessageClick = (msgId: string, threadId: string, content: string, attachments?: any[]) => {
    setMessageDropdownOpen(null); // Close dropdown first
    setTimeout(() => {
      setEditDialog({
        open: true,
        messageId: msgId,
        threadId,
        content,
        attachments
      });
    }, 100);
  };

  const handleConfirmEdit = async (newContent: string) => {
    if (editDialog.messageId && editDialog.threadId) {
      try {
        await editMessage.mutateAsync({
          messageId: editDialog.messageId,
          threadId: editDialog.threadId,
          content: newContent
        });
      } finally {
        forceModalCleanup();
        setEditDialog({ open: false });
      }
    }
  };

  // Delete handlers
  const handleDeleteMessageClick = (msgId: string, threadId: string, content: string) => {
    setMessageDropdownOpen(null); // Close dropdown first
    setTimeout(() => {
      setDeleteDialog({
        open: true,
        messageId: msgId,
        threadId,
        content,
        type: 'message'
      });
    }, 100);
  };

  const handleDeleteThreadClick = () => {
    setThreadDropdownOpen(false); // Close dropdown first
    setTimeout(() => {
      setDeleteDialog({
        open: true,
        threadId: messageId,
        type: 'thread'
      });
    }, 100);
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteDialog.type === 'message' && deleteDialog.messageId && deleteDialog.threadId) {
        await deleteMessage.mutateAsync({
          messageId: deleteDialog.messageId,
          threadId: deleteDialog.threadId
        });
      } else if (deleteDialog.type === 'thread' && deleteDialog.threadId) {
        await deleteThread.mutateAsync(deleteDialog.threadId);
      }
    } finally {
      // Always cleanup, even on error
      forceModalCleanup();
      setDeleteDialog({ open: false, type: 'message' });
      setThreadDropdownOpen(false);
      setMessageDropdownOpen(null);
    }
  };

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
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'emergency':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-900 dark:border-red-700';
      case 'shift':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'general':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700';
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700';
      case 'low':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700';
      default:
        return 'bg-muted text-muted-foreground';
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading conversation...</div>
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
          <div className="text-muted-foreground">No messages in this conversation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={isGroupChat ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-muted'}>
                {isGroupChat ? 'GR' : getAvatarInitials(otherParticipants[0]?.name || 'UN')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-foreground">
                  {displayName}
                </h3>
                {isGroupChat && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                    <Users className="h-3 w-3 mr-1" />
                    Group
                  </Badge>
                )}
              </div>
              {isGroupChat && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {participants.map(p => p.name).join(', ')}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Reply button removed - input bar is always visible at bottom */}
            
            {canDelete && (
              <DropdownMenu open={threadDropdownOpen} onOpenChange={setThreadDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end"
                  onCloseAutoFocus={(e) => e.preventDefault()}
                  onEscapeKeyDown={() => setThreadDropdownOpen(false)}
                  onPointerDownOutside={() => setThreadDropdownOpen(false)}
                  onInteractOutside={() => setThreadDropdownOpen(false)}
                >
                  <DropdownMenuItem
                    onClick={handleDeleteThreadClick}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Conversation
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div id="messages-container" className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4 bg-muted/50">
        {messages.map((message, index) => {
          const isCurrentUser = message.senderId === currentUser?.id;
          const attachmentsList = parseAttachments(message.attachments);
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
                      <span className="text-sm font-medium text-foreground">{message.senderName}</span>
                      <span className="text-xs text-muted-foreground">{formatTimestamp(message.timestamp)}</span>
                    </div>
                  )}
                  
                   <div
                     className={`rounded-lg px-4 py-2 relative group ${
                       isCurrentUser
                         ? 'bg-blue-600 text-white'
                         : 'bg-card text-foreground border border-border'
                     }`}
                   >
                     {canDelete && (
                       <DropdownMenu 
                         open={messageDropdownOpen === message.id} 
                         onOpenChange={(open) => setMessageDropdownOpen(open ? message.id : null)}
                       >
                         <DropdownMenuTrigger asChild>
                           <Button
                             variant="ghost"
                             size="sm"
                             className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                           >
                             <MoreVertical className="h-4 w-4" />
                           </Button>
                         </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            onCloseAutoFocus={(e) => e.preventDefault()}
                            onEscapeKeyDown={() => setMessageDropdownOpen(null)}
                            onPointerDownOutside={() => setMessageDropdownOpen(null)}
                            onInteractOutside={() => setMessageDropdownOpen(null)}
                          >
                            {isCurrentUser && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleMessageInfoClick(message.id, message.threadId)}
                                >
                                  <Info className="h-4 w-4 mr-2" />
                                  Message Info
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditMessageClick(message.id, message.threadId, message.content, attachmentsList)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Message
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessageClick(message.id, message.threadId, message.content)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Message
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                     )}
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
                         <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                           <AlertTriangle className="h-3 w-3 mr-1" />
                           Action Required
                         </Badge>
                       )}
                       {message.adminEyesOnly && (
                         <Badge variant="secondary" className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700">
                           <Eye className="h-3 w-3 mr-1" />
                           Admin Only
                         </Badge>
                       )}
                     </div>
                     
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                          {message.isEdited && (
                            <span className="text-xs italic opacity-60 ml-1">(edited)</span>
                          )}
                        </p>
                       
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
                        
                        {/* Follow-up Information */}
                        <MessageFollowUpView
                          actionRequired={message.actionRequired}
                          followUpDate={message.followUpDate}
                          followUpAssignedTo={message.followUpAssignedTo}
                          followUpAssignedToName={message.followUpAssignedToName}
                          followUpNotes={message.followUpNotes}
                        />
                      
                      {isCurrentUser && (
                        <div className="flex items-center justify-end mt-1 space-x-2">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span className="text-xs opacity-70">{formatTimestamp(message.timestamp)}</span>
                          <MessageReadReceipt
                            messageId={message.id}
                            senderId={message.senderId}
                            threadId={message.threadId}
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteMessageDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMessage.isPending || deleteThread.isPending}
        deleteType={deleteDialog.type}
        messagePreview={deleteDialog.content}
      />

      {/* Message Info Sheet */}
      {messageInfoSheet.messageId && messageInfoSheet.threadId && (
        <MessageInfoSheet
          open={messageInfoSheet.open}
          onOpenChange={(open) => setMessageInfoSheet({ ...messageInfoSheet, open })}
          messageId={messageInfoSheet.messageId}
          threadId={messageInfoSheet.threadId}
        />
      )}

      {/* Edit Message Dialog */}
      <EditMessageDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        onConfirm={handleConfirmEdit}
        isLoading={editMessage.isPending}
        currentContent={editDialog.content || ''}
        attachments={editDialog.attachments}
      />
    </div>
  );
};