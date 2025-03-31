
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Paperclip, Trash2, X, Smile, AlignLeft, 
  AlignCenter, AlignRight, Bold, Italic, List, Link
} from "lucide-react";

export interface MessageComposerProps {
  branchId: string;
  onClose: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({ branchId, onClose }) => {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandComposer = () => {
    setIsExpanded(true);
  };

  const handleSendMessage = () => {
    console.log("Sending message:", { recipient, subject, content });
    // Reset form
    setRecipient("");
    setSubject("");
    setContent("");
    setIsExpanded(false);
    onClose();
  };

  const handleDiscardMessage = () => {
    // Reset form
    setRecipient("");
    setSubject("");
    setContent("");
    setIsExpanded(false);
    onClose();
  };

  if (!isExpanded) {
    return (
      <div className="p-4 border-t bg-white">
        <div 
          className="border rounded-md p-3 cursor-text"
          onClick={handleExpandComposer}
        >
          <p className="text-gray-500">Click to compose a new message...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-t bg-white">
      <div className="border rounded-md shadow-sm">
        <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-medium">New Message</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm text-gray-600">To:</label>
            <Input 
              className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
              placeholder="Enter recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <label className="w-20 text-sm text-gray-600">Subject:</label>
            <Input 
              className="flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
              placeholder="Enter subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
        </div>
        
        <div className="p-3 border-b">
          <div className="flex gap-1 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Link className="h-4 w-4" />
            </Button>
            <div className="flex-1"></div>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
          <textarea
            className="w-full min-h-[150px] resize-none border-0 p-0 focus:outline-none"
            placeholder="Write your message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscardMessage}>
              <Trash2 className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button onClick={handleSendMessage}>
              <Send className="h-4 w-4 mr-1" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
