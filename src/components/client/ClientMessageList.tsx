
import React from "react";
import { format } from "date-fns";
import { Plus, Search, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mocked data for client messages
const mockMessages = [
  {
    id: "msg-1",
    contactId: "admin-1",
    sender: { id: "admin-1", name: "Branch Admin", avatar: "BA", type: "admin" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Your next appointment",
    content: "Your appointment with Dr. Smith is confirmed for Friday at 2:00 PM...",
    timestamp: new Date("2023-05-15T10:30:00"),
    isRead: false,
    hasAttachments: false,
    priority: "medium",
    labels: ["appointment"]
  },
  {
    id: "msg-2",
    contactId: "carer-1",
    sender: { id: "carer-1", name: "Warren, Susan", avatar: "WS", type: "carer" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Schedule update for next week",
    content: "Please note that I'll be arriving 30 minutes later than usual on Monday...",
    timestamp: new Date("2023-05-14T15:45:00"),
    isRead: true,
    hasAttachments: false,
    priority: "medium",
    labels: ["schedule"]
  },
  {
    id: "msg-3",
    contactId: "admin-2",
    sender: { id: "admin-2", name: "Care Coordinator", avatar: "CC", type: "admin" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Your care plan has been updated",
    content: "We've made some updates to your care plan based on your recent assessment...",
    timestamp: new Date("2023-05-13T09:20:00"),
    isRead: true,
    hasAttachments: true,
    priority: "high",
    labels: ["care-plan", "important"]
  },
  {
    id: "msg-4",
    contactId: "carer-1",
    sender: { id: "client-1", name: "You", avatar: "YO", type: "client" },
    recipients: [{ id: "carer-1", name: "Warren, Susan", type: "carer" }],
    subject: "Question about medication",
    content: "I wanted to ask about the new medication schedule we discussed...",
    timestamp: new Date("2023-05-12T17:10:00"),
    isRead: true,
    hasAttachments: false,
    priority: "high",
    labels: ["medication", "question"]
  },
];

interface ClientMessageListProps {
  selectedContactId: string | null;
  selectedMessageId: string | null;
  onMessageSelect: (messageId: string) => void;
  onComposeClick: () => void;
  searchTerm: string;
}

export const ClientMessageList = ({ 
  selectedContactId, 
  selectedMessageId,
  onMessageSelect,
  onComposeClick,
  searchTerm
}: ClientMessageListProps) => {
  // Filter messages based on selected contact and search term
  const filteredMessages = mockMessages.filter(message => {
    const matchesContact = !selectedContactId || message.contactId === selectedContactId;
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesContact && matchesSearch;
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
  
  return (
    <>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Messages</h3>
        <Button
          size="sm"
          className="gap-1"
          onClick={onComposeClick}
        >
          <Plus className="h-4 w-4" />
          <span>New</span>
        </Button>
      </div>
      
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search messages..."
            className="pl-9 bg-gray-50"
            value={searchTerm}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <div 
              key={message.id}
              className={cn(
                "p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100",
                selectedMessageId === message.id ? "bg-blue-50 hover:bg-blue-50" : "",
                !message.isRead ? "bg-gray-50" : ""
              )}
              onClick={() => onMessageSelect(message.id)}
            >
              <div className="flex items-start">
                <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium shrink-0">
                  {message.sender.avatar}
                </div>
                
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <span className={cn(
                        "font-medium text-sm truncate max-w-[150px]",
                        !message.isRead ? "font-semibold" : ""
                      )}>
                        {message.sender.id === "client-1" ? message.recipients[0].name : message.sender.name}
                      </span>
                      
                      {message.sender.type === "carer" && (
                        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Carer
                        </Badge>
                      )}
                      
                      {message.sender.type === "admin" && (
                        <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
                          Admin
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
                  
                  <div className={cn(
                    "text-sm truncate",
                    !message.isRead ? "font-medium" : "text-gray-700"
                  )}>
                    {message.subject}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate mt-1">
                      {message.sender.id === "client-1" ? "You: " : ""}{message.content}
                    </p>
                    
                    {message.hasAttachments && (
                      <FileText className="h-3 w-3 text-gray-400 ml-1 shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
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
