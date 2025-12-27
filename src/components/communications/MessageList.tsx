import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Users, User, AlertTriangle, Eye, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAdminMessageThreads } from "@/hooks/useAdminMessaging";
import { useUserRole } from "@/hooks/useUserRole";
import { useDeleteThread } from "@/hooks/useDeleteMessage";
import { ConfirmDeleteMessageDialog } from "./ConfirmDeleteMessageDialog";
import { forceModalCleanup } from "@/lib/modal-cleanup";
import { MessageReadReceipt } from "./MessageReadReceipt";

interface MessageListProps {
  branchId: string;
  onMessageSelect: (messageId: string) => void;
  selectedMessageId: string | null;
  selectedFilter: "all" | "carers" | "clients" | "admins" | "groups";
  searchTerm: string;
  priorityFilter: string;
  readFilter: string;
  dateFilter: string;
}

export const MessageList = ({
  branchId,
  onMessageSelect,
  selectedMessageId,
  selectedFilter,
  searchTerm,
  priorityFilter,
  readFilter,
  dateFilter
}: MessageListProps) => {
  const { data: currentUser } = useUserRole();
  const { data: threads = [], isLoading, error } = useAdminMessageThreads();
  const deleteThread = useDeleteThread();

  // State for delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    threadId?: string;
    subject?: string;
  }>({ open: false });

  // Dropdown state management (track which thread's dropdown is open)
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

  // Check if user can delete (only admins)
  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin';

  // Filter threads based on current filters
  const filteredThreads = threads.filter(thread => {
    // Search filter
    if (searchTerm && !thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !thread.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))) {
      return false;
    }

    // Contact type filter
    if (selectedFilter !== 'all') {
      const hasMatchingParticipants = thread.participants.some(p => {
        if (selectedFilter === 'carers') return p.type === 'carer';
        if (selectedFilter === 'clients') return p.type === 'client';
        if (selectedFilter === 'admins') return p.type === 'branch_admin' || p.type === 'super_admin';
        if (selectedFilter === 'groups') return thread.participants.length > 1;
        return true;
      });
      if (!hasMatchingParticipants && selectedFilter !== 'groups') return false;
      if (selectedFilter === 'groups' && thread.participants.length <= 1) return false;
    }

    // Read status filter
    if (readFilter !== 'all') {
      const isUnread = thread.unreadCount > 0;
      if (readFilter === 'read' && isUnread) return false;
      if (readFilter === 'unread' && !isUnread) return false;
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // Within a week
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getThreadDisplayInfo = (thread: any) => {
    const isGroup = thread.participants.length > 1;
    const participantNames = thread.participants.map(p => p.name).join(', ');
    
    return {
      isGroup,
      displayName: isGroup ? `Group (${thread.participants.length + 1})` : participantNames || 'Unknown',
      avatar: isGroup ? 'GR' : thread.participants[0]?.name.split(' ').map(n => n.charAt(0)).join('').slice(0, 2) || 'UN'
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32">
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
    );
  }

  if (filteredThreads.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground text-center">
          <p>No messages found</p>
          {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {filteredThreads.map((thread) => {
        const threadInfo = getThreadDisplayInfo(thread);
        const isSelected = thread.id === selectedMessageId;
        
        return (
          <div
            key={thread.id}
            className={`p-3 cursor-pointer hover:bg-muted border-l-2 transition-colors ${
              isSelected 
                ? 'bg-primary/10 border-l-primary' 
                : 'border-l-transparent'
            }`}
            onClick={() => onMessageSelect(thread.id)}
          >
            <div className="flex items-start space-x-3">
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10 bg-muted">
                  <AvatarFallback className={`${threadInfo.isGroup ? 'bg-purple-100 text-purple-700' : 'bg-gray-100'}`}>
                    {threadInfo.avatar}
                  </AvatarFallback>
                </Avatar>
                {threadInfo.isGroup && (
                  <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className={`font-medium text-sm truncate ${
                        thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {threadInfo.displayName}
                    </span>
                    {threadInfo.isGroup && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-purple-100 text-purple-700">
                        Group
                      </Badge>
                    )}
                    {thread.threadType === 'support' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-green-100 text-green-700">
                        Support
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {thread.unreadCount > 0 && (
                      <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-5 h-5 flex items-center justify-center">
                        {thread.unreadCount}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(thread.lastMessage?.timestamp ?
                        thread.lastMessage.timestamp.toISOString() : 
                        thread.updatedAt)}
                    </span>
                    {canDelete && (
                      <DropdownMenu 
                        open={dropdownOpen === thread.id} 
                        onOpenChange={(open) => setDropdownOpen(open ? thread.id : null)}
                      >
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                          align="end"
                          onCloseAutoFocus={(e) => e.preventDefault()}
                          onEscapeKeyDown={() => setDropdownOpen(null)}
                          onPointerDownOutside={() => setDropdownOpen(null)}
                          onInteractOutside={() => setDropdownOpen(null)}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(null); // Close dropdown first
                              setTimeout(() => {
                                setDeleteDialog({
                                  open: true,
                                  threadId: thread.id,
                                  subject: thread.subject
                                });
                              }, 100);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                
                 <div className="flex items-center justify-between">
                   <h4 className={`text-sm truncate ${
                     thread.unreadCount > 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'
                   }`}>
                     {thread.subject}
                   </h4>
                   
                   {/* Message metadata badges */}
                   <div className="flex gap-1 ml-2">
                     {thread.lastMessage?.actionRequired && (
                       <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200 px-1">
                         <AlertTriangle className="h-3 w-3" />
                       </Badge>
                     )}
                     {thread.lastMessage?.adminEyesOnly && (
                       <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200 px-1">
                         <Eye className="h-3 w-3" />
                       </Badge>
                     )}
                     {thread.lastMessage?.priority === 'urgent' && (
                       <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200 px-1">
                         !!
                       </Badge>
                     )}
                     {thread.lastMessage?.priority === 'high' && (
                       <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200 px-1">
                         !
                       </Badge>
                     )}
                   </div>
                 </div>
                
                {thread.lastMessage && (
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <p className={`text-xs truncate flex-1 ${
                      thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      <span className="font-medium">{thread.lastMessage.senderName}:</span>{' '}
                      {thread.lastMessage.content}
                    </p>
                    {currentUser && thread.lastMessage.senderId === currentUser.id && (
                      <MessageReadReceipt
                        messageId={thread.lastMessage.id}
                        senderId={thread.lastMessage.senderId}
                        threadId={thread.id}
                        isCurrentUserSender={true}
                        className="flex-shrink-0"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteMessageDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        onConfirm={async () => {
          try {
            if (deleteDialog.threadId) {
              await deleteThread.mutateAsync(deleteDialog.threadId);
              if (selectedMessageId === deleteDialog.threadId) {
                onMessageSelect(''); // Clear selection if deleting current thread
              }
            }
          } finally {
            // Always cleanup, even on error
            forceModalCleanup();
            setDeleteDialog({ open: false });
            setDropdownOpen(null);
          }
        }}
        isLoading={deleteThread.isPending}
        deleteType="thread"
        messagePreview={deleteDialog.subject}
      />
    </div>
  );
};