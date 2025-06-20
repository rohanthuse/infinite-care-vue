
import React, { useEffect } from "react";
import { format } from "date-fns";
import { 
  FileText, AlertCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMessageThreads } from "@/hooks/useMessages";
import { useUserRole } from "@/hooks/useUserRole";

interface MessageListProps {
  branchId: string;
  onMessageSelect: (messageId: string) => void;
  selectedMessageId: string | null;
  selectedFilter: string;
  searchTerm: string;
  priorityFilter?: string;
  readFilter?: string;
  dateFilter?: string;
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
  const { data: currentUser, isLoading: userLoading } = useUserRole();
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useMessageThreads(branchId);
  
  console.log('MessageList - User loading:', userLoading, 'Threads loading:', threadsLoading, 'Threads:', threads?.length);
  
  // Filter threads based on selected filter and search term
  const filteredThreads = threads.filter(thread => {
    // Apply type filter
    const matchesType = 
      selectedFilter === "all" ? true :
      selectedFilter === "carers" ? thread.participants.some(p => p.type === "carer") :
      selectedFilter === "clients" ? thread.participants.some(p => p.type === "client") :
      selectedFilter === "groups" ? thread.participants.length > 2 : true;
    
    // Apply search filter
    const matchesSearch = 
      thread.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (thread.lastMessage?.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      thread.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply read/unread filter if provided
    const matchesReadStatus = 
      !readFilter || readFilter === "all" ? true :
      readFilter === "read" ? thread.unreadCount === 0 :
      readFilter === "unread" ? thread.unreadCount > 0 : true;

    // Apply date filter if provided
    let matchesDate = true;
    if (dateFilter && dateFilter !== "all" && thread.lastMessage) {
      const now = new Date();
      const messageDate = new Date(thread.lastMessage.createdAt);
      
      if (dateFilter === "today") {
        matchesDate = messageDate.toDateString() === now.toDateString();
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        matchesDate = messageDate >= weekAgo;
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(now.getMonth() - 1);
        matchesDate = messageDate >= monthAgo;
      }
    }
    
    return matchesType && matchesSearch && matchesReadStatus && matchesDate;
  });
  
  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const isToday = messageDate.getDate() === now.getDate() &&
                   messageDate.getMonth() === now.getMonth() &&
                   messageDate.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return format(messageDate, "HH:mm");
    } else {
      return format(messageDate, "dd MMM");
    }
  };

  // Auto-select first thread if none selected
  useEffect(() => {
    if ((!selectedMessageId) && filteredThreads.length > 0) {
      onMessageSelect(filteredThreads[0].id);
    }
  }, [filteredThreads, selectedMessageId, onMessageSelect]);

  const getParticipantBadge = (participants: Array<{type: string}>) => {
    const hasClient = participants.some(p => p.type === 'client');
    const hasCarer = participants.some(p => p.type === 'carer');
    const hasAdmin = participants.some(p => p.type === 'super_admin' || p.type === 'branch_admin');

    if (hasClient && hasAdmin) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-green-50 text-green-700 border-green-200">
          Client
        </Badge>
      );
    } else if (hasCarer && hasAdmin) {
      return (
        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
          Carer
        </Badge>
      );
    }
    return null;
  };
  
  // Show loading only when user or threads are actually loading
  const isLoading = userLoading || threadsLoading;
  
  if (isLoading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading messages...
      </div>
    );
  }

  // Show error if there's an error
  if (threadsError) {
    return (
      <div className="p-6 text-center text-red-500">
        Error loading messages: {threadsError.message}
      </div>
    );
  }

  // Show no messages found
  if (filteredThreads.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {threads.length === 0 ? 'No messages yet' : 'No messages found'}
      </div>
    );
  }

  return (
    <div>
      {filteredThreads.map((thread) => (
        <div 
          key={thread.id}
          className={cn(
            "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100",
            selectedMessageId === thread.id ? "bg-blue-50 hover:bg-blue-50" : "",
            thread.unreadCount > 0 ? "bg-gray-50" : ""
          )}
          onClick={() => onMessageSelect(thread.id)}
        >
          <div className="flex items-start">
            <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium shrink-0">
              {thread.participants[0]?.name?.charAt(0) || 'U'}
            </div>
            
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className={cn(
                    "font-medium text-sm truncate max-w-[150px]",
                    thread.unreadCount > 0 ? "font-semibold" : ""
                  )}>
                    {thread.participants.map(p => p.name).join(", ")}
                  </span>
                  
                  {getParticipantBadge(thread.participants)}
                  
                  {thread.unreadCount > 0 && (
                    <div className="ml-2 bg-blue-600 text-white text-xs rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                      {thread.unreadCount}
                    </div>
                  )}
                </div>
                
                <span className="text-xs text-gray-500">
                  {thread.lastMessage ? formatMessageDate(thread.lastMessage.createdAt) : ''}
                </span>
              </div>
              
              <div className={cn(
                "text-sm truncate",
                thread.unreadCount > 0 ? "font-medium" : "text-gray-700"
              )}>
                {thread.subject}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 truncate mt-1">
                  {thread.lastMessage?.content || 'No messages yet'}
                </p>
                
                {thread.lastMessage?.hasAttachments && (
                  <FileText className="h-3 w-3 text-gray-400 ml-1 shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
