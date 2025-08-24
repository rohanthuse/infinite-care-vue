import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCarerMessageContacts } from "@/hooks/useCarerMessaging";
import { useUnifiedCreateThread } from "@/hooks/useUnifiedMessaging";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, User } from "lucide-react";

interface CarerMessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CarerMessageComposer = ({ open, onOpenChange }: CarerMessageComposerProps) => {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  
  const { data: contacts, isLoading: contactsLoading } = useCarerMessageContacts();
  const createThreadMutation = useUnifiedCreateThread();

  const handleSend = async () => {
    if (!selectedClientId || !subject.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a client and fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedContact = contacts?.find(c => c.id === selectedClientId);
    if (!selectedContact) {
      toast({
        title: "Error",
        description: "Selected client not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createThreadMutation.mutateAsync({
        recipientIds: [selectedContact.auth_user_id],
        recipientNames: [selectedContact.name],
        recipientTypes: ['client'],
        subject: subject.trim(),
        initialMessage: content.trim(),
        priority: 'normal',
        messageType: 'general'
      });

      // Reset form and close
      setSelectedClientId("");
      setSubject("");
      setContent("");
      onOpenChange(false);

      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${selectedContact.name}.`,
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setSelectedClientId("");
    setSubject("");
    setContent("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            New Message
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Send to Client</Label>
            {contactsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading clients...</span>
              </div>
            ) : !contacts || contacts.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <User className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">No clients available</p>
                <p className="text-xs">Clients must have registered accounts to receive messages</p>
              </div>
            ) : (
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex items-center gap-2">
                        <span>{contact.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Enter message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSend}
              disabled={!selectedClientId || !subject.trim() || !content.trim() || createThreadMutation.isPending}
            >
              {createThreadMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarerMessageComposer;