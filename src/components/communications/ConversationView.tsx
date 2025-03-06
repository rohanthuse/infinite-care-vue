
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronLeft, 
  Send, 
  MoreVertical, 
  Phone, 
  Mail,
  Clock
} from "lucide-react";

interface ConversationViewProps {
  conversation: any; // Replace with proper type
  onBack: () => void;
}

export const ConversationView = ({ conversation, onBack }: ConversationViewProps) => {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  // Mock conversation messages
  const [messages, setMessages] = useState([
    {
      id: "m1",
      sender: "them",
      content: "Hello, I have a question about my upcoming appointment.",
      timestamp: "May 15, 10:30 AM"
    },
    {
      id: "m2",
      sender: "you",
      content: "Hi there! I'd be happy to help. What would you like to know?",
      timestamp: "May 15, 10:32 AM"
    },
    {
      id: "m3",
      sender: "them",
      content: "Do you have availability next Thursday? I need to reschedule.",
      timestamp: "May 15, 10:45 AM"
    }
  ]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    setIsSending(true);
    
    setTimeout(() => {
      const newMsg = {
        id: `m${messages.length + 1}`,
        sender: "you",
        content: newMessage,
        timestamp: new Date().toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: 'numeric', 
          minute: 'numeric',
          hour12: true
        })
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage("");
      setIsSending(false);
      
      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    }, 500);
  };

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full"
            onClick={onBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${conversation.type === 'client' ? 'bg-blue-600' : 'bg-green-600'}`}>
            {conversation.sender.avatar}
          </div>
          
          <div>
            <div className="font-medium">{conversation.sender.name}</div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span>{conversation.type === 'client' ? 'Client' : 'Carer'}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
              <span>{conversation.sender.id}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
            <Phone className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
            <Mail className="h-4 w-4 text-blue-600" />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 min-h-[400px]">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender === 'you' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="text-sm">
                  {msg.content}
                </div>
                <div 
                  className={`text-xs mt-1 flex items-center ${
                    msg.sender === 'you' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button 
            className="self-end bg-blue-600 hover:bg-blue-700"
            disabled={!newMessage.trim() || isSending}
            onClick={handleSendMessage}
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift + Enter for a new line
        </p>
      </div>
    </div>
  );
};
