
import React, { useState } from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, Reply, ReplyAll, Forward, 
  MoreHorizontal, Download, Trash, Star, Flag,
  Paperclip, AlertCircle, BadgeCheck, Building2
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
    sender: { id: "carer-1", name: "Charuma, Charmaine", avatar: "CC", type: "carer" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Scheduling question for next week",
    content: "Hello,\n\nI wanted to ask about the schedule for next week. I noticed that I'm assigned to Mrs. Pender for Monday morning, but I have a doctor's appointment that day. Would it be possible to reassign me to a different time or day?\n\nI've already spoken with Susan, and she mentioned she might be available to cover for me.\n\nThank you,\nCharmaine",
    timestamp: new Date("2023-05-15T10:30:00"),
    isRead: false,
    hasAttachments: false,
    priority: "medium",
    labels: ["schedule"],
    thread: []
  },
  {
    id: "msg-2",
    sender: { id: "client-1", name: "Pender, Eva", avatar: "EP", type: "client" },
    recipients: [{ id: "admin", name: "Branch Admin", type: "admin" }],
    subject: "Medication updates",
    content: "Dear Admin,\n\nPlease note that my medication has been updated by my doctor. I've attached the new prescription and schedule.\n\nI would appreciate if all carers assigned to me could be informed of these changes as soon as possible.\n\nThe main changes are to my blood pressure medication dosage and the addition of a new supplement that needs to be taken with breakfast.\n\nThank you for your assistance.\n\nBest regards,\nEva Pender",
    timestamp: new Date("2023-05-14T15:45:00"),
    isRead: true,
    hasAttachments: true,
    attachments: [
      { name: "Updated_Prescription.pdf", size: "1.2 MB", type: "pdf" },
      { name: "Medication_Schedule.docx", size: "285 KB", type: "docx" }
    ],
    priority: "high",
    labels: ["medication", "important"],
    thread: [
      {
        id: "thread-1",
        sender: { id: "admin", name: "Branch Admin", avatar: "BA", type: "admin" },
        content: "Thank you for updating us, Eva. I'll make sure all carers are informed of these changes right away. Is there anything specific they should be aware of regarding the new supplement?",
        timestamp: new Date("2023-05-14T16:30:00"),
        hasAttachments: false
      },
      {
        id: "thread-2",
        sender: { id: "client-1", name: "Pender, Eva", avatar: "EP", type: "client" },
        content: "Yes, the supplement should be taken with food, specifically with breakfast, and not on an empty stomach. It's also important that it's not taken at the same time as my calcium supplement.",
        timestamp: new Date("2023-05-14T17:15:00"),
        hasAttachments: false
      }
    ]
  }
];

interface MessageViewProps {
  messageId: string;
  onReply: () => void;
}

export const MessageView = ({ messageId, onReply }: MessageViewProps) => {
  const [showFullThread, setShowFullThread] = useState(false);
  
  // Find the message by ID
  const message = mockMessages.find(msg => msg.id === messageId);
  
  if (!message) {
    return (
      <div className="p-8 text-center text-gray-500">
        Message not found
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{message.subject}</h2>
          {message.priority === "high" && (
            <Badge variant="destructive" className="ml-2">High Priority</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Reply" onClick={onReply}>
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Forward">
            <Forward className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Star className="h-4 w-4 mr-2" />
                <span>Mark as important</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Flag className="h-4 w-4 mr-2" />
                <span>Flag message</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Trash className="h-4 w-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-6">
          <div className="flex items-start">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarFallback className="bg-gray-200">
                {message.sender.avatar}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center">
                <div className="font-medium">{message.sender.name}</div>
                
                {message.sender.type === "carer" && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    Carer
                  </Badge>
                )}
                
                {message.sender.type === "client" && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-xs bg-green-50 text-green-700 border-green-200">
                    <Building2 className="h-3 w-3 mr-1" />
                    Client
                  </Badge>
                )}
              </div>
              
              <div className="text-sm text-gray-500 mt-0.5">
                To: {message.recipients.map(r => r.name).join(", ")}
              </div>
              
              <div className="text-sm text-gray-500">
                {format(message.timestamp, "PPpp")}
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm whitespace-pre-line">
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
        </div>
        
        {/* Thread */}
        {message.thread && message.thread.length > 0 && (
          <div className="mt-8 border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Previous messages ({message.thread.length})</h3>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowFullThread(!showFullThread)}
              >
                {showFullThread ? "Hide" : "Show"} thread
              </Button>
            </div>
            
            {showFullThread && (
              <div className="space-y-6">
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
                          <div className="font-medium text-sm">{reply.sender.name}</div>
                          
                          {reply.sender.type === "carer" && (
                            <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              <span>Carer</span>
                            </Badge>
                          )}
                          
                          {reply.sender.type === "client" && (
                            <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-green-50 text-green-700 border-green-200">
                              <Building2 className="h-3 w-3 mr-1" />
                              <span>Client</span>
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {format(reply.timestamp, "PPpp")}
                        </div>
                        
                        <div className="mt-2 text-sm whitespace-pre-line">
                          {reply.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button className="w-full" onClick={onReply}>
          <Reply className="h-4 w-4 mr-2" />
          Reply
        </Button>
      </div>
    </div>
  );
};
