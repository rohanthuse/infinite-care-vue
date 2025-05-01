
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

// Mocked data - would come from an API
const mockMessages = [
  {
    id: "msg-1",
    contactId: "admin-1",
    sender: { id: "admin-1", name: "Branch Admin", avatar: "BA", type: "admin" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Your next appointment",
    content: "Hello,\n\nYour appointment with Dr. Smith is confirmed for Friday at 2:00 PM at the Main Clinic, Room 204.\n\nPlease bring your medication list and arrive 15 minutes early to complete any necessary paperwork.\n\nIf you need to reschedule, please let us know at least 24 hours in advance.\n\nBest regards,\nBranch Admin",
    timestamp: new Date("2023-05-15T10:30:00"),
    isRead: false,
    hasAttachments: false,
    priority: "medium",
    labels: ["appointment"],
    thread: []
  },
  {
    id: "msg-2",
    contactId: "carer-1",
    sender: { id: "carer-1", name: "Warren, Susan", avatar: "WS", type: "carer" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Schedule update for next week",
    content: "Hello,\n\nPlease note that I'll be arriving 30 minutes later than usual on Monday due to a team meeting. Instead of 9:00 AM, I'll arrive at 9:30 AM.\n\nOur session will still be the full duration, I'll just stay 30 minutes later to make up the time.\n\nPlease let me know if this causes any inconvenience for you.\n\nBest regards,\nSusan Warren",
    timestamp: new Date("2023-05-14T15:45:00"),
    isRead: true,
    hasAttachments: false,
    priority: "medium",
    labels: ["schedule"],
    thread: []
  },
  {
    id: "msg-3",
    contactId: "admin-2",
    sender: { id: "admin-2", name: "Care Coordinator", avatar: "CC", type: "admin" },
    recipients: [{ id: "client-1", name: "You", type: "client" }],
    subject: "Your care plan has been updated",
    content: "Hello,\n\nWe've made some updates to your care plan based on your recent assessment. The updated plan includes:\n\n1. Increased frequency of physical therapy sessions from once to twice weekly\n2. New dietary recommendations from your nutritionist\n3. Updated medication schedule\n\nI've attached the full updated care plan document for your review. Please take some time to look it over and let me know if you have any questions or concerns.\n\nWe can schedule a call to discuss these changes in more detail if you'd like.\n\nRegards,\nCare Coordinator",
    timestamp: new Date("2023-05-13T09:20:00"),
    isRead: true,
    hasAttachments: true,
    priority: "high",
    attachments: [
      { name: "Updated_Care_Plan.pdf", size: "1.4 MB", type: "pdf" }
    ],
    labels: ["care-plan", "important"],
    thread: []
  },
  {
    id: "msg-4",
    contactId: "carer-1",
    sender: { id: "client-1", name: "You", avatar: "YO", type: "client" },
    recipients: [{ id: "carer-1", name: "Warren, Susan", type: "carer" }],
    subject: "Question about medication",
    content: "Hi Susan,\n\nI wanted to ask about the new medication schedule we discussed during your last visit. I've been taking the blood pressure medication in the morning as suggested, but I'm experiencing dizziness about an hour after taking it.\n\nShould I continue with this schedule or would it be better to take it with food or in the evening instead?\n\nThanks,\n[Your Name]",
    timestamp: new Date("2023-05-12T17:10:00"),
    isRead: true,
    hasAttachments: false,
    priority: "high",
    labels: ["medication", "question"],
    thread: [
      {
        id: "thread-1",
        sender: { id: "carer-1", name: "Warren, Susan", avatar: "WS", type: "carer" },
        content: "Hi there,\n\nThank you for letting me know about this side effect. Dizziness can be common when starting new blood pressure medication. I would suggest taking it with food to see if that helps reduce the dizziness.\n\nI'll also make a note to discuss this with the doctor at your next appointment. In the meantime, if the dizziness is severe or doesn't improve over the next few days, please let us know right away.\n\nBest regards,\nSusan",
        timestamp: new Date("2023-05-12T18:30:00"),
        hasAttachments: false
      }
    ]
  },
];

interface ClientMessageViewProps {
  messageId: string;
  onReply: () => void;
}

export const ClientMessageView = ({ messageId, onReply }: ClientMessageViewProps) => {
  const [showFullThread, setShowFullThread] = useState(false);
  
  // Find the message by ID
  const message = mockMessages.find(msg => msg.id === messageId);
  
  if (!message) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-gray-400 text-lg mb-2">Message not found</div>
        <p className="text-sm text-gray-500 max-w-md text-center">
          The selected message may have been deleted or is not available.
        </p>
        <Button variant="outline" className="mt-4" onClick={onReply}>
          Create New Message
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold truncate">{message.subject}</h2>
        
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
              <DropdownMenuSeparator />
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <div className="flex items-start">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback className="bg-gray-200">
                {message.sender.avatar}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center">
                <div className="font-medium">{message.sender.id === "client-1" ? "You" : message.sender.name}</div>
                
                {message.sender.type === "carer" && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                    Carer
                  </Badge>
                )}
                
                {message.sender.type === "admin" && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
                    Admin
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mt-0.5">
                To: {message.recipients.map(r => r.id === "client-1" ? "You" : r.name).join(", ")}
              </div>
              
              <div className="text-sm text-gray-500">
                {format(message.timestamp, "MMMM d, yyyy, h:mm a")}
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-sm whitespace-pre-line">
            {message.content}
          </div>
          
          {/* Attachments */}
          {message.hasAttachments && message.attachments && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="text-sm font-medium mb-2">Attachments ({message.attachments.length})</div>
              <div className="space-y-2">
                {message.attachments.map((attachment, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-2 border border-gray-200 rounded-md bg-gray-50"
                  >
                    <Paperclip className="h-4 w-4 text-gray-500 mr-2" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{attachment.name}</div>
                      <div className="text-xs text-gray-500">{attachment.size}</div>
                    </div>
                    <Button variant="ghost" size="icon" title="Download attachment">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Thread/replies */}
          {message.thread && message.thread.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <div className="text-sm font-medium mb-2">Thread ({message.thread.length} {message.thread.length === 1 ? "reply" : "replies"})</div>
              <div className="space-y-4">
                {message.thread.map((reply) => (
                  <div key={reply.id} className="pl-4 border-l-2 border-gray-200">
                    <div className="flex items-start">
                      <Avatar className="h-8 w-8 mr-3">
                        <AvatarFallback className="bg-gray-200 text-xs">
                          {reply.sender.avatar}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="font-medium text-sm">{reply.sender.id === "client-1" ? "You" : reply.sender.name}</div>
                          
                          {reply.sender.type === "carer" && (
                            <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                              Carer
                            </Badge>
                          )}
                          
                          {reply.sender.type === "admin" && (
                            <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
                              Admin
                            </Badge>
                          )}
                          
                          <span className="text-xs text-gray-500 ml-2">
                            {format(reply.timestamp, "MMM d, h:mm a")}
                          </span>
                        </div>
                        
                        <div className="mt-1 text-sm whitespace-pre-line">
                          {reply.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
