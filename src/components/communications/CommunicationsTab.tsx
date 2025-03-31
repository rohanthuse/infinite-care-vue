
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Search, Filter, Plus, Clock, Users, PenSquare, Archive, Inbox, Send, Trash2, BookOpen } from "lucide-react";
import { ContactSidebar } from "./ContactSidebar";
import { MessageFilters } from "./MessageFilters";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { MessageComposer } from "./MessageComposer";

export interface CommunicationsTabProps {
  branchId: string;
  branchName: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId, branchName }) => {
  const [activeTab, setActiveTab] = useState("emails");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "carers" | "clients" | "groups">("all");
  const [showComposer, setShowComposer] = useState(false);
  const [selectedContactType, setSelectedContactType] = useState<"all" | "carers" | "clients" | "groups">("clients");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Communications for {branchName}</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search messages..."
              className="w-64 pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button size="sm" onClick={() => setShowComposer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="emails" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Internal Notes
          </TabsTrigger>
        </TabsList>
        
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 border rounded-lg overflow-hidden bg-white">
            <ContactSidebar 
              branchId={branchId}
              contactType={selectedContactType}
              onContactTypeChange={setSelectedContactType}
              onContactSelect={setSelectedContactId}
              selectedContactId={selectedContactId}
              searchTerm={contactSearchTerm}
              onSearchChange={setContactSearchTerm}
            />
          </div>
          
          <div className="col-span-9">
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="border-b">
                <MessageFilters 
                  selectedFilter={selectedFilter}
                  onFilterChange={(filter) => setSelectedFilter(filter as "all" | "carers" | "clients" | "groups")}
                />
              </div>
              
              <div className="grid grid-cols-12">
                <div className="col-span-4 border-r h-[calc(100vh-280px)] overflow-y-auto">
                  <TabsContent value="emails" className="m-0">
                    <MessageList 
                      branchId={branchId}
                      onMessageSelect={setSelectedMessageId}
                      selectedMessageId={selectedMessageId}
                      selectedFilter={selectedFilter}
                      searchTerm={searchTerm}
                    />
                  </TabsContent>
                  <TabsContent value="sms" className="m-0">
                    <MessageList 
                      branchId={branchId}
                      onMessageSelect={setSelectedMessageId}
                      selectedMessageId={selectedMessageId}
                      selectedFilter={selectedFilter}
                      searchTerm={searchTerm}
                    />
                  </TabsContent>
                  <TabsContent value="internal" className="m-0">
                    <MessageList 
                      branchId={branchId}
                      onMessageSelect={setSelectedMessageId}
                      selectedMessageId={selectedMessageId}
                      selectedFilter={selectedFilter}
                      searchTerm={searchTerm}
                    />
                  </TabsContent>
                </div>
                
                <div className="col-span-8 h-[calc(100vh-280px)] overflow-y-auto">
                  {selectedMessageId ? (
                    <MessageView 
                      messageId={selectedMessageId} 
                      onReply={() => setShowComposer(true)} 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-lg font-medium">Select a message to view</p>
                      <p className="text-sm">Or create a new message to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
      
      {showComposer && (
        <MessageComposer 
          branchId={branchId}
          onClose={() => setShowComposer(false)} 
        />
      )}
    </div>
  );
};

export default CommunicationsTab;
