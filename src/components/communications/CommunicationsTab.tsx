
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { ContactSidebar } from "./ContactSidebar";
import { MessageComposer } from "./MessageComposer";
import { MessageFilters } from "./MessageFilters";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId, branchName }) => {
  const [selectedFilter, setSelectedFilter] = useState<"all" | "carers" | "clients" | "groups">("all");
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
    setSelectedMessageId(null);
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  const handleFilterChange = (filter: "all" | "carers" | "clients" | "groups") => {
    setSelectedFilter(filter);
  };

  const handleFilterOptionsChange = (priority?: string, readStatus?: string, date?: string) => {
    if (priority) setPriorityFilter(priority);
    if (readStatus) setReadFilter(readStatus);
    if (date) setDateFilter(date);
  };

  const handleReplyToMessage = () => {
    setIsComposeOpen(true);
  };

  const handleCloseComposer = () => {
    setIsComposeOpen(false);
  };

  return (
    <div className="flex h-full w-full">
      <ContactSidebar 
        branchId={branchId || ""} 
        onContactSelect={handleContactSelect}
        contactType={selectedFilter}
        onContactTypeChange={handleFilterChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <div className="flex flex-col flex-1">
        <MessageFilters 
          selectedFilter={selectedFilter} 
          onFilterChange={handleFilterChange}
          priorityFilter={priorityFilter}
          readFilter={readFilter}
          dateFilter={dateFilter}
          onFilterOptionsChange={handleFilterOptionsChange}
        />
        <Tabs defaultValue="inbox" className="flex flex-col flex-1">
          <TabsList className="border-b">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          <div className="flex flex-1">
            <TabsContent value="inbox" className="flex-1">
              <MessageList 
                branchId={branchId || ""} 
                onMessageSelect={handleMessageSelect}
                selectedMessageId={selectedMessageId}
                selectedFilter={selectedFilter}
                searchTerm={searchTerm}
              />
            </TabsContent>
            <TabsContent value="sent" className="flex-1">
              <MessageList 
                branchId={branchId || ""}
                onMessageSelect={handleMessageSelect}
                selectedMessageId={selectedMessageId}
                selectedFilter={selectedFilter}
                searchTerm={searchTerm}
              />
            </TabsContent>
            <TabsContent value="drafts" className="flex-1">
              <MessageList 
                branchId={branchId || ""}
                onMessageSelect={handleMessageSelect}
                selectedMessageId={selectedMessageId}
                selectedFilter={selectedFilter}
                searchTerm={searchTerm}
              />
            </TabsContent>
            <MessageView messageId={selectedMessageId} onReply={handleReplyToMessage} />
          </div>
        </Tabs>
        <MessageComposer branchId={branchId || ""} onClose={handleCloseComposer} />
      </div>
    </div>
  );
};
