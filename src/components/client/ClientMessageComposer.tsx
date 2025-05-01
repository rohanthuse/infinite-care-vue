
import React, { useState, useEffect } from "react";
import { X, Send, PaperclipIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mocked data
const mockAdmins = [
  { id: "admin-1", name: "Branch Admin", avatar: "BA", type: "admin" },
  { id: "admin-2", name: "Care Coordinator", avatar: "CC", type: "admin" },
];

const mockCarers = [
  { id: "carer-1", name: "Warren, Susan", avatar: "WS", type: "carer" },
  { id: "carer-2", name: "Smith, John", avatar: "SJ", type: "carer" },
  { id: "carer-3", name: "Charuma, Charmaine", avatar: "CC", type: "carer" },
];

const messageTemplates = [
  { id: "template-1", label: "Appointment Change Request", content: "I would like to request a change to my upcoming appointment scheduled for [DATE] at [TIME]. Could we please reschedule to [SUGGESTED DATE/TIME]?\n\nReason for change: [YOUR REASON]\n\nThank you for your assistance." },
  { id: "template-2", label: "Medication Question", content: "I have a question regarding my medication [MEDICATION NAME].\n\n[DESCRIBE YOUR QUESTION OR CONCERN]\n\nCurrent dosage: [CURRENT DOSAGE]\nHow long I've been taking it: [DURATION]\nAny side effects I'm experiencing: [SIDE EFFECTS IF ANY]\n\nThank you for your help." },
  { id: "template-3", label: "General Feedback", content: "I would like to provide some feedback regarding my recent experience:\n\n[DESCRIBE YOUR EXPERIENCE]\n\nWhat went well: [POSITIVES]\nWhat could be improved: [SUGGESTIONS]\n\nThank you for considering my feedback." },
];

interface ClientMessageComposerProps {
  selectedContactId?: string | null;
  onClose: () => void;
  onSend: () => void;
}

export const ClientMessageComposer = ({ 
  selectedContactId,
  onClose,
  onSend 
}: ClientMessageComposerProps) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipient, setRecipient] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  // Set the selected contact as recipient if provided
  useEffect(() => {
    if (selectedContactId) {
      setRecipient(selectedContactId);
    }
  }, [selectedContactId]);

  const handleTemplateSelect = (templateId: string) => {
    const template = messageTemplates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      toast({
        title: "Template applied",
        description: `Applied template: ${template.label}`
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setAttachments(Array.from(event.target.files));
      toast({
        title: "Files attached",
        description: `${event.target.files.length} file(s) attached`
      });
    }
  };

  const handleSendMessage = () => {
    // Validation
    if (!recipient) {
      toast({
        title: "Please select a recipient",
        variant: "destructive"
      });
      return;
    }
    
    if (!subject.trim()) {
      toast({
        title: "Please enter a subject",
        variant: "destructive"
      });
      return;
    }
    
    if (!content.trim()) {
      toast({
        title: "Please enter a message",
        variant: "destructive"
      });
      return;
    }
    
    // Send message
    console.log("Sending message:", {
      recipient,
      subject,
      content,
      urgent,
      attachments
    });
    
    toast({
      title: "Message sent",
      description: "Your message has been sent successfully."
    });
    
    onSend();
  };

  // Get recipient details
  const getRecipientDetails = (id: string) => {
    const carer = mockCarers.find(c => c.id === id);
    if (carer) return carer;
    
    const admin = mockAdmins.find(a => a.id === id);
    if (admin) return admin;
    
    return null;
  };

  const selectedRecipient = recipient ? getRecipientDetails(recipient) : null;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Message</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Recipient selector */}
        <div className="space-y-2">
          <Label htmlFor="recipient">To</Label>
          
          {selectedRecipient ? (
            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <Avatar className="h-6 w-6 mr-2">
                <AvatarFallback>{selectedRecipient.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1">{selectedRecipient.name}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => setRecipient("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Select onValueChange={setRecipient} value={recipient}>
              <SelectTrigger>
                <SelectValue placeholder="Select a recipient" />
              </SelectTrigger>
              <SelectContent>
                <div className="py-1 px-2 text-xs font-medium text-gray-500">Care Team</div>
                {mockAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    <div className="flex items-center">
                      <span>{admin.name}</span>
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-purple-50 text-purple-700 border-purple-200">
                        Admin
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
                <div className="py-1 px-2 text-xs font-medium text-gray-500">My Carers</div>
                {mockCarers.map((carer) => (
                  <SelectItem key={carer.id} value={carer.id}>
                    <div className="flex items-center">
                      <span>{carer.name}</span>
                      <Badge variant="outline" className="ml-2 px-1 py-0 text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Carer
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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter message subject"
          />
        </div>

        {/* Template selector */}
        <div className="space-y-2">
          <Label htmlFor="template">Use a template (optional)</Label>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a message template" />
            </SelectTrigger>
            <SelectContent>
              {messageTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500">Templates help you write common messages quickly. Replace the placeholders with your information.</p>
        </div>
        
        {/* Message content */}
        <div className="space-y-2">
          <Label htmlFor="content">Message</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your message here..."
            className="min-h-[200px]"
          />
        </div>
        
        {/* Attachments */}
        <div className="space-y-2">
          <Label htmlFor="attachments" className="flex items-center gap-2">
            Attachments
            <Button variant="outline" size="sm" className="h-7" asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                <PaperclipIcon className="h-3 w-3 mr-1" />
                Attach files
              </label>
            </Button>
            <input
              type="file"
              id="file-upload"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </Label>
          
          {attachments.length > 0 && (
            <div className="bg-gray-50 p-2 rounded-md">
              <p className="text-sm">{attachments.length} file(s) selected</p>
              <ul className="text-xs text-gray-500">
                {Array.from(attachments).map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Urgent flag */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="urgent"
            checked={urgent}
            onChange={(e) => setUrgent(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="urgent" className="text-sm">
            Mark as urgent
          </Label>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendMessage}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
