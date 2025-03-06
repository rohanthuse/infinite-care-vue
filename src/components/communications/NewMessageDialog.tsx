
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (messageData: any) => void;
}

export const NewMessageDialog = ({
  open,
  onOpenChange,
  onSend,
}: NewMessageDialogProps) => {
  const { toast } = useToast();
  const [recipientType, setRecipientType] = useState<string>("client");
  const [recipientId, setRecipientId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Mock data for recipients
  const clients = [
    { id: "CL-001", name: "Eva Pender" },
    { id: "CL-002", name: "Patricia Fulcher" },
    { id: "CL-003", name: "Ursula Baulch" },
    { id: "CL-004", name: "Victoria Ren" },
    { id: "CL-005", name: "Ifeoluwa Iyaniwura" },
  ];

  const carers = [
    { id: "CA-001", name: "Charmaine Charuma" },
    { id: "CA-002", name: "Susan Warren" },
    { id: "CA-003", name: "Opeyemi Ayo-Famure" },
    { id: "CA-004", name: "John Smith" },
    { id: "CA-005", name: "Mary Williams" },
  ];

  const handleSend = () => {
    if (!recipientId) {
      toast({
        title: "Please select a recipient",
        variant: "destructive",
      });
      return;
    }

    if (!subject) {
      toast({
        title: "Please enter a subject",
        variant: "destructive",
      });
      return;
    }

    if (!message) {
      toast({
        title: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const recipients = recipientType === "client" ? clients : carers;
    const recipient = recipients.find(r => r.id === recipientId);

    setTimeout(() => {
      onSend({
        recipientType,
        recipientId,
        recipient: recipient?.name,
        subject,
        message,
        timestamp: new Date().toISOString(),
      });
      
      // Reset form
      setRecipientType("client");
      setRecipientId("");
      setSubject("");
      setMessage("");
      setIsLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setRecipientType("client");
    setRecipientId("");
    setSubject("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(newState) => {
      if (!newState) resetForm();
      onOpenChange(newState);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Send a message to a client or carer
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipientType" className="text-right">
              Send to
            </Label>
            <Select 
              value={recipientType} 
              onValueChange={setRecipientType}
            >
              <SelectTrigger id="recipientType" className="col-span-3">
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="carer">Carer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="recipient" className="text-right">
              Recipient
            </Label>
            <Select 
              value={recipientId} 
              onValueChange={setRecipientId}
            >
              <SelectTrigger id="recipient" className="col-span-3">
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                {recipientType === "client" ? (
                  clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))
                ) : (
                  carers.map(carer => (
                    <SelectItem key={carer.id} value={carer.id}>
                      {carer.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">
              Subject
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right self-start pt-2">
              Message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="col-span-3"
              rows={5}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
