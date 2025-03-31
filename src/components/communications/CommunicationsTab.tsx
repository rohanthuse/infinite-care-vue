
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Plus, MessageSquare, Mail, Phone, Video, 
  Calendar, Send, Paperclip, Clock, Check, X, User,
  MoreHorizontal, FileText, Inbox, SendIcon, Archive,
  Trash2, AlertCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

// Mock data for messages
const mockMessages = [
  {
    id: "msg-001",
    sender: "John Michael",
    avatar: "JM",
    subject: "Appointment Change Request",
    content: "Hello, I would like to reschedule my appointment for next Tuesday if possible. Please let me know if 2pm works. Thank you!",
    date: new Date("2023-11-18T10:30:00"),
    read: true,
    folder: "inbox",
    type: "email",
    email: "john.michael@example.com",
    phone: "+44 20 7946 0587"
  },
  {
    id: "msg-002",
    sender: "Emma Thompson",
    avatar: "ET",
    subject: "Medication Delivery",
    content: "Hi there, I wanted to confirm that my medication will be delivered tomorrow as discussed. Please confirm the time frame. Thanks!",
    date: new Date("2023-11-18T09:15:00"),
    read: false,
    folder: "inbox",
    type: "email",
    email: "emma.t@example.com",
    phone: "+44 20 7946 1122"
  },
  {
    id: "msg-003",
    sender: "Wendy Smith",
    avatar: "WS",
    subject: "Question about billing",
    content: "I have a question about my recent bill. There seems to be a charge I don't recognize. Could you please review and explain? Thanks in advance.",
    date: new Date("2023-11-17T16:45:00"),
    read: true,
    folder: "inbox",
    type: "email",
    email: "w.smith@example.com",
    phone: "+44 20 7946 3344"
  },
  {
    id: "msg-004",
    sender: "Robert Johnson",
    avatar: "RJ",
    subject: "Feedback on care",
    content: "I wanted to express my appreciation for the excellent care provided by Nurse Sarah last week. She was professional, kind, and very attentive. I would like to specifically request her for future visits if possible.",
    date: new Date("2023-11-16T14:20:00"),
    read: true,
    folder: "inbox",
    type: "email",
    email: "r.johnson@example.com",
    phone: "+44 20 7946 5566"
  },
  {
    id: "msg-005",
    sender: "Lisa Rodrigues",
    avatar: "LR",
    subject: "New caregiver inquiry",
    content: "Hi, I'm interested in learning more about your caregiving services for my father who was recently discharged from hospital. Could someone please contact me to discuss options?",
    date: new Date("2023-11-15T11:10:00"),
    read: false,
    folder: "inbox",
    type: "email",
    email: "lisa.r@example.com",
    phone: "+44 20 7946 7788"
  },
  {
    id: "msg-006",
    sender: "David Wilson",
    avatar: "DW",
    subject: "Appointment confirmation",
    content: "Thank you for scheduling my therapy session for Friday at 3pm. I'm looking forward to it!",
    date: new Date("2023-11-14T17:30:00"),
    read: true,
    folder: "archive",
    type: "email",
    email: "d.wilson@example.com",
    phone: "+44 20 7946 9900"
  },
  {
    id: "msg-007",
    sender: "Kate Williams",
    avatar: "KW",
    subject: "Equipment delivery",
    content: "I received the mobility equipment today. Thank you for organizing this so quickly. It will be very helpful.",
    date: new Date("2023-11-13T09:45:00"),
    read: true,
    folder: "archive",
    type: "email",
    email: "k.williams@example.com",
    phone: "+44 20 7946 1234"
  },
  {
    id: "msg-008",
    sender: "Olivia Parker",
    avatar: "OP",
    subject: "Follow-up appointment",
    content: "Following our discussion yesterday, I would like to schedule a follow-up appointment for next month. Please let me know what dates are available.",
    date: new Date("2023-11-12T13:15:00"),
    read: true,
    folder: "inbox",
    type: "email",
    email: "o.parker@example.com",
    phone: "+44 20 7946 5678"
  },
];

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    to: "",
    subject: "",
    content: ""
  });
  const { toast } = useToast();

  // Filter messages based on current folder and search query
  const filteredMessages = mockMessages.filter(message => {
    const matchesFolder = activeTab === 'all' || message.folder === activeTab;
    const matchesSearch = 
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFolder && matchesSearch;
  });

  const selectedMessageData = selectedMessage 
    ? mockMessages.find(msg => msg.id === selectedMessage) 
    : null;

  const handleSendMessage = () => {
    if (!newMessage.to || !newMessage.subject || !newMessage.content) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields before sending.",
        variant: "destructive",
      });
      return;
    }

    // Here you would normally send the message via an API
    console.log("Sending message:", newMessage);
    
    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully.",
    });
    
    setComposeDialogOpen(false);
    setNewMessage({
      to: "",
      subject: "",
      content: ""
    });
  };

  const markAsRead = (id: string) => {
    // Here you would normally update the message status via an API
    console.log("Marking message as read:", id);
    setSelectedMessage(id);
  };

  const archiveMessage = (id: string) => {
    // Here you would normally archive the message via an API
    console.log("Archiving message:", id);
    
    toast({
      title: "Message Archived",
      description: "The message has been moved to the archive.",
    });
    
    if (id === selectedMessage) {
      setSelectedMessage(null);
    }
  };

  const deleteMessage = (id: string) => {
    // Here you would normally delete the message via an API
    console.log("Deleting message:", id);
    
    toast({
      title: "Message Deleted",
      description: "The message has been moved to the trash.",
    });
    
    if (id === selectedMessage) {
      setSelectedMessage(null);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4">Communications</h2>
      <p className="text-gray-500 mb-6">Manage internal and external communications.</p>
      
      <Tabs defaultValue="inbox" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="inbox" className="flex items-center">
              <Inbox className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <SendIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sent</span>
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center">
              <Archive className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Archive</span>
            </TabsTrigger>
            <TabsTrigger value="trash" className="flex items-center">
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Trash</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search messages..."
                className="pl-10 pr-4 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={composeDialogOpen} onOpenChange={setComposeDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                  <DialogDescription>
                    Create and send a new message to clients or staff.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="recipient" className="text-right text-sm font-medium">
                      To
                    </label>
                    <div className="col-span-3">
                      <Select value={newMessage.to} onValueChange={(value) => setNewMessage({...newMessage, to: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipient" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockMessages.map((msg, index) => (
                            <SelectItem key={index} value={msg.email}>
                              {msg.sender} ({msg.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="subject" className="text-right text-sm font-medium">
                      Subject
                    </label>
                    <div className="col-span-3">
                      <Input
                        id="subject"
                        value={newMessage.subject}
                        onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                        placeholder="Enter subject"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <label htmlFor="message" className="text-right text-sm font-medium pt-2">
                      Message
                    </label>
                    <div className="col-span-3">
                      <Textarea
                        id="message"
                        rows={8}
                        value={newMessage.content}
                        onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                        placeholder="Type your message here"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <div className="flex items-center mr-auto">
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9 mr-2">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleSendMessage} type="button">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 border rounded-md overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <div className="text-sm font-medium">
                {activeTab === "inbox" && "Inbox"}
                {activeTab === "sent" && "Sent Items"}
                {activeTab === "archive" && "Archive"}
                {activeTab === "trash" && "Trash"}
                
                {activeTab === "inbox" && <Badge className="ml-2 bg-blue-500">{filteredMessages.filter(m => !m.read).length}</Badge>}
              </div>
            </div>
            
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={cn(
                      "p-3 cursor-pointer transition-colors hover:bg-gray-50",
                      selectedMessage === message.id && "bg-blue-50 hover:bg-blue-50",
                      !message.read && "bg-gray-50"
                    )}
                    onClick={() => markAsRead(message.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {message.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className={cn(
                            "font-medium text-sm",
                            !message.read && "font-semibold"
                          )}>
                            {message.sender}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(message.date, 'MMM d')}
                          </div>
                        </div>
                        <div className={cn(
                          "text-sm truncate mb-1",
                          !message.read && "font-medium"
                        )}>
                          {message.subject}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {message.content.substring(0, 60)}...
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Inbox className="h-6 w-6 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-medium mb-1">No messages found</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {searchQuery ? "Try adjusting your search." : "Your inbox is empty."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setComposeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Compose Message
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="md:col-span-2">
            {selectedMessageData ? (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedMessageData.subject}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => archiveMessage(selectedMessageData.id)} title="Archive">
                        <Archive className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMessage(selectedMessageData.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <MessageSquare className="mr-2 h-4 w-4" /> Reply
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" /> Print
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertCircle className="mr-2 h-4 w-4" /> Mark as Unread
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedMessageData.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedMessageData.sender}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(selectedMessageData.date, 'MMM d, yyyy h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="prose prose-sm max-w-none">
                    <p>{selectedMessageData.content}</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex flex-wrap gap-2 mt-6">
                    <Button className="flex-1 sm:flex-none">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-none">
                      <Video className="h-4 w-4 mr-2" />
                      Video
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center border rounded-md p-8">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 font-medium mb-1">No message selected</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Select a message from the list to view its contents
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Tabs>
    </div>
  );
};
