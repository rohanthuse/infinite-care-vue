
import React, { useState } from "react";
import { X, Send, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMessagingContacts, useCreateThread, useSendMessage } from "@/hooks/useUnifiedMessaging";

interface UnifiedMessageComposerProps {
  selectedContactId?: string | null;
  selectedThreadId?: string | null;
  onClose: () => void;
  onSend: () => void;
}

export const UnifiedMessageComposer = ({ 
  selectedContactId, 
  selectedThreadId,
  onClose, 
  onSend 
}: UnifiedMessageComposerProps) => {
  const [recipientId, setRecipientId] = useState(selectedContactId || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  
  const { data: contacts = [] } = useMessagingContacts();
  const createThread = useCreateThread();
  const sendMessage = useSendMessage();
  
  const isReply = !!selectedThreadId;
  const selectedRecipient = contacts.find(contact => contact.id === recipientId);
  
  const handleSend = async () => {
    if (!message.trim()) {
      return;
    }
    
    try {
      if (isReply && selectedThreadId) {
        // Send reply to existing thread
        await sendMessage.mutateAsync({
          threadId: selectedThreadId,
          content: message.trim()
        });
      } else {
        // Create new thread
        if (!recipientId || !subject.trim()) {
          return;
        }
        
        const recipient = contacts.find(contact => contact.id === recipientId);
        if (!recipient) {
          return;
        }
        
        await createThread.mutateAsync({
          recipientId: recipient.id,
          recipientName: recipient.name,
          recipientType: recipient.type,
          subject: subject.trim(),
          initialMessage: message.trim()
        });
      }
      
      // Reset form
      setMessage("");
      if (!isReply) {
        setSubject("");
        setRecipientId("");
      }
      
      onSend();
    } catch (error: any) {
      console.error('[UnifiedMessageComposer] Send error:', error);
    }
  };
  
  const isLoading = createThread.isPending || sendMessage.isPending;
  
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {isReply ? "Reply to Message" : "New Message"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {!isReply && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">To:</label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        <div className="flex items-center gap-2">
                          <span>{contact.name}</span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {contact.type === 'branch_admin' ? 'Administrator' : 
                             contact.type === 'carer' ? 'Carer' : 'Client'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Subject:</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this message about?"
                  className="w-full"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2">Message:</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 resize-none"
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" disabled>
            <Paperclip className="h-4 w-4 mr-2" />
            Attach File
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={
                isLoading || 
                !message.trim() || 
                (!isReply && (!recipientId || !subject.trim()))
              }
            >
              {isLoading ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
