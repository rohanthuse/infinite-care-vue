
import React, { useState, useEffect } from "react";
import { X, Send, PlusCircle, Paperclip, Clock, ChevronDown, Save, BadgeCheck, Building2, CheckCheck, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Mocked data - would come from an API
const mockCarers = [
  { id: "carer-1", name: "Charuma, Charmaine", avatar: "CC", type: "carer" },
  { id: "carer-2", name: "Warren, Susan", avatar: "WS", type: "carer" },
  { id: "carer-3", name: "Ayo-Famure, Opeyemi", avatar: "AF", type: "carer" },
  { id: "carer-4", name: "Smith, John", avatar: "SJ", type: "carer" },
];

const mockClients = [
  { id: "client-1", name: "Pender, Eva", avatar: "EP", type: "client" },
  { id: "client-2", name: "Fulcher, Patricia", avatar: "FP", type: "client" },
  { id: "client-3", name: "Baulch, Ursula", avatar: "BU", type: "client" },
  { id: "client-4", name: "Ren, Victoria", avatar: "RV", type: "client" },
];

const mockTemplates = [
  { id: "template-1", name: "Appointment Confirmation", content: "Dear [Name],\n\nThis is to confirm your appointment scheduled for [Date] at [Time].\n\nPlease let us know if you need to reschedule.\n\nBest regards,\nMed-Infinite Team" },
  { id: "template-2", name: "Schedule Change", content: "Dear [Name],\n\nWe would like to inform you about a change in your schedule.\n\nOriginal schedule: [Original Date/Time]\nNew schedule: [New Date/Time]\n\nPlease confirm if this works for you.\n\nBest regards,\nMed-Infinite Team" },
  { id: "template-3", name: "Medication Reminder", content: "Dear [Name],\n\nThis is a friendly reminder about your medication schedule.\n\nPlease ensure you follow the prescribed dosage and timing for optimal health benefits.\n\nBest regards,\nMed-Infinite Team" },
];

interface MessageComposerProps {
  branchId: string;
  onClose: () => void;
  selectedContactId?: string | null;
}

export const MessageComposer = ({ 
  branchId, 
  onClose,
  selectedContactId 
}: MessageComposerProps) => {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipients, setRecipients] = useState<string[]>([]);
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<{
    carers: string[];
    clients: string[];
  }>({
    carers: [],
    clients: []
  });
  
  // Set initial recipients if a contact is selected
  useEffect(() => {
    if (selectedContactId) {
      const isCarer = mockCarers.some(carer => carer.id === selectedContactId);
      const isClient = mockClients.some(client => client.id === selectedContactId);
      
      if (isCarer) {
        setSelectedContacts(prev => ({
          ...prev,
          carers: [selectedContactId]
        }));
      } else if (isClient) {
        setSelectedContacts(prev => ({
          ...prev,
          clients: [selectedContactId]
        }));
      }
      
      setRecipients([selectedContactId]);
    }
  }, [selectedContactId]);
  
  const handleApplyTemplate = (templateId: string) => {
    const template = mockTemplates.find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      toast.success("Template applied", {
        description: `Applied template: ${template.name}`
      });
    }
  };
  
  const handleContactToggle = (contactId: string, contactType: "carers" | "clients") => {
    setSelectedContacts(prev => {
      const newSelected = { ...prev };
      if (newSelected[contactType].includes(contactId)) {
        newSelected[contactType] = newSelected[contactType].filter(id => id !== contactId);
      } else {
        newSelected[contactType] = [...newSelected[contactType], contactId];
      }
      return newSelected;
    });
  };
  
  const handleApplyContacts = () => {
    const allSelectedIds = [...selectedContacts.carers, ...selectedContacts.clients];
    setRecipients(allSelectedIds);
    setShowContactSelector(false);
  };
  
  const getContactDetails = (contactId: string) => {
    const carer = mockCarers.find(c => c.id === contactId);
    if (carer) return carer;
    
    const client = mockClients.find(c => c.id === contactId);
    if (client) return client;
    
    return null;
  };
  
  const handleSendMessage = () => {
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please enter a message");
      return;
    }
    
    if (recipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    
    // Send the message (would go to API)
    console.log("Sending message:", {
      subject,
      content,
      recipients,
      priority
    });
    
    toast.success("Message sent successfully", {
      description: `Your message has been sent to ${recipients.length} recipient(s).`
    });
    
    // Close the composer
    onClose();
  };
  
  const handleSaveAsDraft = () => {
    toast.success("Message saved as draft");
    onClose();
  };
  
  const handleScheduleSend = () => {
    toast.info("Schedule sending feature coming soon");
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">New Message</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Schedule</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleScheduleSend}>
                <Clock className="h-4 w-4 mr-2" />
                <span>Schedule Send</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSaveAsDraft}>
                <Save className="h-4 w-4 mr-2" />
                <span>Save as Draft</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {showContactSelector ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-medium">Select Recipients</h3>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowContactSelector(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyContacts}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <BadgeCheck className="h-4 w-4 mr-1 text-blue-600" />
                Carers
              </h4>
              <div className="space-y-2">
                {mockCarers.map(carer => (
                  <div 
                    key={carer.id}
                    className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <Checkbox 
                      id={`carer-${carer.id}`}
                      checked={selectedContacts.carers.includes(carer.id)}
                      onCheckedChange={() => handleContactToggle(carer.id, "carers")}
                      className="mr-2"
                    />
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="bg-gray-200 text-xs">
                        {carer.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <Label 
                      htmlFor={`carer-${carer.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      {carer.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <Building2 className="h-4 w-4 mr-1 text-green-600" />
                Clients
              </h4>
              <div className="space-y-2">
                {mockClients.map(client => (
                  <div 
                    key={client.id}
                    className="flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <Checkbox 
                      id={`client-${client.id}`}
                      checked={selectedContacts.clients.includes(client.id)}
                      onCheckedChange={() => handleContactToggle(client.id, "clients")}
                      className="mr-2"
                    />
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback className="bg-gray-200 text-xs">
                        {client.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <Label 
                      htmlFor={`client-${client.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      {client.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="to" className="block text-sm font-medium mb-1">To</Label>
              <div className="flex items-center border border-gray-200 rounded-md p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
                <div className="flex flex-wrap gap-1 flex-1">
                  {recipients.map(recipientId => {
                    const contact = getContactDetails(recipientId);
                    if (!contact) return null;
                    
                    return (
                      <Badge 
                        key={recipientId}
                        variant="outline"
                        className={cn(
                          "px-2 py-1 gap-1 rounded-md",
                          contact.type === "carer" 
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-green-50 text-green-700 border-green-200"
                        )}
                      >
                        {contact.type === "carer" ? (
                          <BadgeCheck className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        <span>{contact.name}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setRecipients(prev => prev.filter(id => id !== recipientId))}
                        />
                      </Badge>
                    );
                  })}
                  
                  {recipients.length === 0 && (
                    <span className="text-gray-400 text-sm">Select recipients...</span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setShowContactSelector(true)}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="priority" className="block text-sm font-medium mb-1">Priority</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                  >
                    <span className="flex items-center">
                      {priority === "high" && <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>}
                      {priority === "medium" && <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>}
                      {priority === "low" && <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>}
                      {priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuItem onClick={() => setPriority("high")}>
                    <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                    <span>High Priority</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("medium")}>
                    <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                    <span>Medium Priority</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPriority("low")}>
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                    <span>Low Priority</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div>
              <Label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="message" className="block text-sm font-medium">Message</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      Templates <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Select Template</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {mockTemplates.map(template => (
                      <DropdownMenuItem 
                        key={template.id}
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        {template.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Textarea
                id="message"
                placeholder="Type your message here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" size="sm" className="mr-2">
              <Paperclip className="h-4 w-4 mr-2" />
              <span>Attach</span>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSaveAsDraft}
            >
              Save as Draft
            </Button>
            <Button 
              size="sm"
              onClick={handleSendMessage}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
