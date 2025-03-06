
import React from "react";
import { format } from "date-fns";
import { 
  Star, FileText, User, Users, AlertCircle,
  BadgeCheck, Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mocked data - would come from an API
const mockMessages = [
  {
    id: "msg-1",
    sender: { id: "carer-1", name: "Charuma, Charmaine", avatar: "CC", type: "carer" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Scheduling question for next week",
    content: "Hello, I wanted to ask about the schedule for next week...",
    timestamp: new Date("2023-05-15T10:30:00"),
    isRead: false,
    hasAttachments: false,
    priority: "medium",
    labels: ["schedule"]
  },
  {
    id: "msg-2",
    sender: { id: "client-1", name: "Pender, Eva", avatar: "EP", type: "client" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Medication updates",
    content: "Please note that my medication has been updated by my doctor...",
    timestamp: new Date("2023-05-14T15:45:00"),
    isRead: true,
    hasAttachments: true,
    priority: "high",
    labels: ["medication", "important"]
  },
  {
    id: "msg-3",
    sender: { id: "carer-2", name: "Warren, Susan", avatar: "WS", type: "carer" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Training completion certificate",
    content: "Attached is my completed training certificate as requested...",
    timestamp: new Date("2023-05-13T09:20:00"),
    isRead: true,
    hasAttachments: true,
    priority: "low",
    labels: ["training"]
  },
  {
    id: "msg-4",
    sender: { id: "client-2", name: "Fulcher, Patricia", avatar: "FP", type: "client" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Feedback on recent visit",
    content: "I wanted to share some feedback about the carer who visited yesterday...",
    timestamp: new Date("2023-05-12T17:10:00"),
    isRead: false,
    hasAttachments: false,
    priority: "medium",
    labels: ["feedback"]
  },
  {
    id: "msg-5",
    sender: { id: "admin", name: "Branch Admin", type: "admin" },
    recipients: [
      { id: "carer-1", name: "Charuma, Charmaine", type: "carer" },
      { id: "carer-2", name: "Warren, Susan", type: "carer" },
      { id: "carer-3", name: "Ayo-Famure, Opeyemi", type: "carer" }
    ],
    subject: "New policies announcement",
    content: "Please review the updated company policies attached...",
    timestamp: new Date("2023-05-11T11:00:00"),
    isRead: true,
    hasAttachments: true,
    priority: "high",
    labels: ["policy", "important"]
  },
  {
    id: "msg-6",
    sender: { id: "admin", name: "Branch Admin", type: "admin" },
    recipients: [
      { id: "client-1", name: "Pender, Eva", type: "client" },
      { id: "client-2", name: "Fulcher, Patricia", type: "client" },
      { id: "client-3", name: "Baulch, Ursula", type: "client" }
    ],
    subject: "Holiday schedule changes",
    content: "Due to the upcoming holiday, there will be some changes to the schedule...",
    timestamp: new Date("2023-05-10T14:20:00"),
    isRead: true,
    hasAttachments: false,
    priority: "medium",
    labels: ["schedule"]
  }
];

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
  // Filter messages based on selected filter and search term
  const filteredMessages = mockMessages.filter(message => {
    // Apply type filter
    const matchesType = 
      selectedFilter === "all" ? true :
      selectedFilter === "carers" ? message.sender.type === "carer" || 
                                   message.recipients.some(r => r.type === "carer") :
      selectedFilter === "clients" ? message.sender.type === "client" || 
                                    message.recipients.some(r => r.type === "client") :
      selectedFilter === "groups" ? message.recipients.length > 1 : true;
    
    // Apply search filter
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.recipients.some(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply priority filter if provided
    const matchesPriority = 
      !priorityFilter || priorityFilter === "all" ? true : 
      message.priority === priorityFilter.toLowerCase();

    // Apply read/unread filter if provided
    const matchesReadStatus = 
      !readFilter || readFilter === "all" ? true :
      readFilter === "read" ? message.isRead :
      readFilter === "unread" ? !message.isRead : true;

    // Apply date filter if provided
    let matchesDate = true;
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      const messageDate = new Date(message.timestamp);
      
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
    
    return matchesType && matchesSearch && matchesPriority && matchesReadStatus && matchesDate;
  });
  
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

  // Check if selected message is in filtered results
  const selectedMessageExists = selectedMessageId && filteredMessages.some(msg => msg.id === selectedMessageId);
  
  // If no messages match the filter, clear the selection
  React.useEffect(() => {
    if (selectedMessageId && !selectedMessageExists && filteredMessages.length > 0) {
      // If the selected message doesn't exist in filtered results but we have other messages,
      // auto-select the first one
      onMessageSelect(filteredMessages[0].id);
    }
  }, [selectedMessageId, selectedMessageExists, filteredMessages, onMessageSelect]);
  
  return (
    <div className="divide-y divide-gray-100">
      {filteredMessages.length > 0 ? (
        filteredMessages.map((message) => (
          <div 
            key={message.id}
            className={cn(
              "p-3 hover:bg-gray-50 cursor-pointer",
              selectedMessageId === message.id ? "bg-blue-50 hover:bg-blue-50" : "",
              !message.isRead ? "bg-gray-50" : ""
            )}
            onClick={() => onMessageSelect(message.id)}
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium shrink-0">
                {message.sender.avatar || message.sender.name.charAt(0)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={cn(
                      "font-medium text-sm truncate max-w-[150px]",
                      !message.isRead ? "font-semibold" : ""
                    )}>
                      {message.sender.name}
                    </span>
                    
                    {message.sender.type === "carer" && (
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <BadgeCheck className="h-3 w-3 mr-1" />
                        <span className="hidden md:inline">Carer</span>
                      </Badge>
                    )}
                    
                    {message.sender.type === "client" && (
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-green-50 text-green-700 border-green-200">
                        <Building2 className="h-3 w-3 mr-1" />
                        <span className="hidden md:inline">Client</span>
                      </Badge>
                    )}
                    
                    {message.priority === "high" && (
                      <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
                    )}
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {formatMessageDate(message.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "text-sm truncate max-w-[200px]",
                    !message.isRead ? "font-medium" : "text-gray-700"
                  )}>
                    {message.subject}
                  </div>
                  
                  <div className="flex items-center">
                    {message.hasAttachments && (
                      <FileText className="h-3 w-3 text-gray-400 ml-1" />
                    )}
                    
                    {message.recipients.length > 1 && (
                      <Users className="h-3 w-3 text-gray-400 ml-1" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 truncate mt-1">
                  {message.content}
                </p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="p-6 text-center text-gray-500">
          No messages found
        </div>
      )}
    </div>
  );
};
