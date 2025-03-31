
import React from "react";
import { Button } from "@/components/ui/button";
import { Reply, Download, Trash2, Star, MoreHorizontal } from "lucide-react";

export interface MessageViewProps {
  messageId: string | null;
  onReply: () => void;
}

export const MessageView: React.FC<MessageViewProps> = ({ messageId, onReply }) => {
  // Mock message details
  const messageDetails = {
    id: "msg1",
    sender: "John Doe",
    email: "john.doe@example.com",
    avatar: "JD",
    subject: "Schedule Change Request",
    content: `
      Dear Admin,
      
      I hope this message finds you well. I'm writing to request a change in my schedule for next week. 
      
      Due to a personal appointment, I would need to take Thursday afternoon off. I'm available to work 
      on Saturday instead to make up for the missed hours.
      
      Please let me know if this arrangement works for you.
      
      Thank you for your understanding.
      
      Best regards,
      John Doe
    `,
    time: "10:30 AM",
    date: "June 15, 2023",
    attachments: [
      { name: "availability_calendar.pdf", size: "245 KB" }
    ]
  };

  if (!messageId) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center flex-1 p-6 bg-gray-50 border-l text-center">
        <div className="text-gray-400 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
          </svg>
        </div>
        <h3 className="font-medium text-gray-700 mb-1">No message selected</h3>
        <p className="text-sm text-gray-500">Select a message from the list to view its contents</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col border-l">
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <h2 className="text-lg font-semibold">{messageDetails.subject}</h2>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReply}>
            <Reply className="h-4 w-4 mr-1" />
            Reply
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Star className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-6 flex-1 overflow-y-auto bg-white">
        <div className="flex items-start gap-4 mb-6">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-lg">
            {messageDetails.avatar}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-medium">{messageDetails.sender}</h3>
              <span className="text-xs text-gray-500">&lt;{messageDetails.email}&gt;</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {messageDetails.date} at {messageDetails.time}
            </div>
          </div>
        </div>
        
        <div className="prose prose-sm max-w-none">
          {messageDetails.content.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        
        {messageDetails.attachments && messageDetails.attachments.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Attachments ({messageDetails.attachments.length})</h4>
            <div className="space-y-2">
              {messageDetails.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{attachment.name}</div>
                    <div className="text-xs text-gray-500">{attachment.size}</div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
