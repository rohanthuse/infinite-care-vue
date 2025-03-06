
import React, { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  MessageCircle, 
  Phone, 
  Send, 
  Users,
  Search,
  Bell,
  Plus,
  MessageSquare,
  Eye,
  Filter,
  ChevronDown
} from "lucide-react";
import { NewMessageDialog } from "./NewMessageDialog";
import { ConversationView } from "./ConversationView";

interface CommTabProps {
  branchId: string;
}

export const CommTab = ({ branchId }: CommTabProps) => {
  const { toast } = useToast();
  const [activeMessageType, setActiveMessageType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState<boolean>(false);
  const [viewType, setViewType] = useState<"list" | "conversation">("list");

  // Mock data for messages
  const messages = [
    {
      id: "msg1",
      type: "client",
      sender: {
        id: "CL-001",
        name: "Eva Pender",
        avatar: "EP"
      },
      lastMessage: "Do you have availability next Thursday?",
      timestamp: "10:45 AM",
      date: "Today",
      unread: true,
      status: "Active"
    },
    {
      id: "msg2",
      type: "carer",
      sender: {
        id: "CA-001",
        name: "Charmaine Charuma",
        avatar: "CC"
      },
      lastMessage: "I've completed the training module you sent.",
      timestamp: "Yesterday",
      date: "May 15",
      unread: false,
      status: "Active"
    },
    {
      id: "msg3",
      type: "client",
      sender: {
        id: "CL-003",
        name: "Ursula Baulch",
        avatar: "UB"
      },
      lastMessage: "Thank you for arranging the visit.",
      timestamp: "2 days ago",
      date: "May 14",
      unread: false,
      status: "Active"
    },
    {
      id: "msg4",
      type: "carer",
      sender: {
        id: "CA-003",
        name: "Opeyemi Ayo-Famure",
        avatar: "OA"
      },
      lastMessage: "Is there an update on my schedule for next week?",
      timestamp: "3 days ago",
      date: "May 13",
      unread: true,
      status: "Active"
    },
    {
      id: "msg5",
      type: "client",
      sender: {
        id: "CL-005",
        name: "Ifeoluwa Iyaniwura",
        avatar: "II"
      },
      lastMessage: "I need to reschedule the appointment.",
      timestamp: "4 days ago",
      date: "May 12",
      unread: false,
      status: "Active"
    }
  ];

  const handleNewMessage = () => {
    setNewMessageOpen(true);
  };

  const handleSendMessage = (messageData: any) => {
    toast({
      title: "Message Sent",
      description: `Your message to ${messageData.recipient} has been sent.`,
    });
    setNewMessageOpen(false);
  };

  const handleConversationSelect = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setViewType("conversation");
  };

  const handleBackToList = () => {
    setViewType("list");
    setSelectedConversation(null);
  };

  const filteredMessages = messages.filter(message => {
    // Filter by message type
    if (activeMessageType !== "all" && message.type !== activeMessageType) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !message.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !message.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const selectedMessage = messages.find(message => message.id === selectedConversation);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Communications</h2>
        <p className="text-gray-500">Manage your conversations with clients and carers</p>
      </div>

      <NewMessageDialog 
        open={newMessageOpen} 
        onOpenChange={setNewMessageOpen}
        onSend={handleSendMessage}
      />

      <div className="border rounded-lg bg-white shadow-sm">
        {viewType === "list" ? (
          <>
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
              <div className="flex items-center space-x-2">
                <Tabs defaultValue="all" onValueChange={setActiveMessageType} className="w-full">
                  <TabsList>
                    <TabsTrigger value="all">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      All
                    </TabsTrigger>
                    <TabsTrigger value="client">
                      <Users className="h-4 w-4 mr-2" />
                      Clients
                    </TabsTrigger>
                    <TabsTrigger value="carer">
                      <Bell className="h-4 w-4 mr-2" />
                      Carers
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-60">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleNewMessage}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${message.unread ? 'bg-blue-50' : ''}`}
                    onClick={() => handleConversationSelect(message.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${message.type === 'client' ? 'bg-blue-600' : 'bg-green-600'}`}>
                        {message.sender.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="font-medium text-sm flex items-center">
                            {message.sender.name}
                            {message.unread && (
                              <span className="ml-2 h-2 w-2 rounded-full bg-blue-600"></span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <div className="text-sm text-gray-600 truncate">{message.lastMessage}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{message.type === 'client' ? 'Client' : 'Carer'}</span>
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{message.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No messages found</p>
                  <Button 
                    variant="link" 
                    className="text-blue-600 mt-2"
                    onClick={handleNewMessage}
                  >
                    Start a new conversation
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <ConversationView 
            conversation={selectedMessage} 
            onBack={handleBackToList} 
          />
        )}
      </div>
    </div>
  );
};

export default CommTab;
