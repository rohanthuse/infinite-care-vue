import React, { useState, useEffect } from "react";
import { 
  X, Send, Clock, ChevronDown, Save, BadgeCheck, Building2, 
  FileUp, Mail, Phone, User, Users, Bell, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Paperclip } from "lucide-react";

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
  const [files, setFiles] = useState<File[]>([]);
  const [messageType, setMessageType("");
  const [branchAdmin, setBranchAdmin] = useState("");
  const [staff, setStaff] = useState("");
  const [client, setClient] = useState("");
  const [actionRequired, setActionRequired] = useState(false);
  const [adminEyesOnly, setAdminEyesOnly] = useState(false);
  const [notificationMethods, setNotificationMethods] = useState({
    email: false,
    mobileApp: false,
    otherEmail: false
  });

  // Font formatting state
  const [fontFamily, setFontFamily] = useState("Sans Serif");
  const [fontSize, setFontSize] = useState("14px");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

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
    if (!messageType.trim()) {
      toast.error("Please select a message type");
      return;
    }

    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Please enter message details");
      return;
    }
    
    if (recipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    
    // Send the message (would go to API)
    console.log("Sending message:", {
      type: messageType,
      subject,
      content,
      recipients,
      priority,
      adminEyesOnly,
      actionRequired,
      notificationMethods
    });
    
    toast.success("Message sent successfully");
    onClose();
  };
  
  const handleSaveAsDraft = () => {
    toast.success("Message saved as draft");
    onClose();
  };
  
  const handleScheduleSend = () => {
    toast.info("Schedule sending feature coming soon");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setFiles(Array.from(fileList));
      toast.success(`${fileList.length} file(s) selected`);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const fileList = event.dataTransfer.files;
    if (fileList) {
      setFiles(Array.from(fileList));
      toast.success(`${fileList.length} file(s) uploaded`);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">New Message</h2>
          {adminEyesOnly && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200">
              Admin Eyes Only
            </Badge>
          )}
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
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="type" className="block text-sm font-medium mb-1">Type *</Label>
            <select
              id="type"
              value={messageType}
              onChange={(e) => setMessageType(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2"
              required
            >
              <option value="">Select Type</option>
              <option value="incident">Incident Report</option>
              <option value="shift">Shift Update</option>
              <option value="general">General Communication</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          {/* Recipients Fields */}
          <div>
            <Label htmlFor="branchAdmin" className="block text-sm font-medium mb-1">Branch Admin</Label>
            <Input
              id="branchAdmin"
              value={branchAdmin}
              onChange={(e) => setBranchAdmin(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="staff" className="block text-sm font-medium mb-1">Staff</Label>
            <Input
              id="staff"
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="client" className="block text-sm font-medium mb-1">Client</Label>
            <Input
              id="client"
              value={client}
              onChange={(e) => setClient(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="subject" className="block text-sm font-medium mb-1">Subject *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={messageType === "incident" ? "Incident Report - Brief Description" : "Enter subject"}
              className="w-full"
              required
            />
          </div>

          <div>
            <Label htmlFor="content" className="block text-sm font-medium mb-1">Details *</Label>
            <div className="mb-2 flex items-center gap-2 border border-gray-200 p-2 rounded-t-md bg-gray-50">
              <select 
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="px-2 py-1 border rounded"
              >
                <option>Sans Serif</option>
                <option>Serif</option>
                <option>Monospace</option>
              </select>

              <select 
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="px-2 py-1 border rounded w-20"
              >
                {[12, 14, 16, 18, 20].map(size => (
                  <option key={size}>{size}px</option>
                ))}
              </select>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isBold && "bg-gray-200")}
                onClick={() => setIsBold(!isBold)}
              >
                B
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isItalic && "bg-gray-200")}
                onClick={() => setIsItalic(!isItalic)}
              >
                I
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className={cn("px-2", isUnderline && "bg-gray-200")}
                onClick={() => setIsUnderline(!isUnderline)}
              >
                U
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={messageType === "incident" ? 
                "Please provide:\n- Detailed description of the incident\n- Time and date\n- People involved\n- Actions taken\n- Resolution\n- Next steps" : 
                "Type your message here..."
              }
              className={cn(
                "min-h-[200px]",
                "font-[" + fontFamily + "]",
                "text-[" + fontSize + "]",
                isBold && "font-bold",
                isItalic && "italic",
                isUnderline && "underline"
              )}
            />
          </div>

          <div>
            <Label className="block text-sm font-medium mb-1">Attachments</Label>
            <div 
              className="border-2 border-dashed border-gray-300 rounded-md p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <div className="text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-1 text-sm text-gray-600">
                  Drop files here to upload or
                </p>
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" size="sm" className="mt-2" asChild>
                    <span>Select files...</span>
                  </Button>
                </label>
              </div>
              {files.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">{files.length} file(s) selected</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="actionRequired"
                checked={actionRequired}
                onCheckedChange={(checked) => setActionRequired(checked as boolean)}
              />
              <Label htmlFor="actionRequired">Action Required?</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="adminEyesOnly"
                checked={adminEyesOnly}
                onCheckedChange={(checked) => setAdminEyesOnly(checked as boolean)}
              />
              <Label htmlFor="adminEyesOnly">Admin Eyes Only</Label>
            </div>
          </div>

          {/* Notification Methods */}
          <div>
            <Label className="block text-sm font-medium mb-2">Send Notification By:</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="emailNotif"
                  checked={notificationMethods.email}
                  onCheckedChange={(checked) => 
                    setNotificationMethods(prev => ({ ...prev, email: checked as boolean }))
                  }
                />
                <Label htmlFor="emailNotif" className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="mobileNotif"
                  checked={notificationMethods.mobileApp}
                  onCheckedChange={(checked) => 
                    setNotificationMethods(prev => ({ ...prev, mobileApp: checked as boolean }))
                  }
                />
                <Label htmlFor="mobileNotif" className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  Mobile App
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="otherEmailNotif"
                  checked={notificationMethods.otherEmail}
                  onCheckedChange={(checked) => 
                    setNotificationMethods(prev => ({ ...prev, otherEmail: checked as boolean }))
                  }
                />
                <Label htmlFor="otherEmailNotif" className="flex items-center">
                  <Mail className="h-4 w-4 mr-1" />
                  Other Email Address
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" size="sm" className="mr-2">
              <FileText className="h-4 w-4 mr-2" />
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
