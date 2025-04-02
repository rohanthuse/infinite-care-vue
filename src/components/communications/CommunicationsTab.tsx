
import React, { useState } from "react";
import { ContactSidebar } from "./ContactSidebar";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { MessageComposer } from "./MessageComposer";
import { MessageFilters } from "./MessageFilters";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId = "1", branchName = "Med-Infinite" }) => {
  // State management
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "carers" | "clients" | "groups">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Handler for filter changes
  const handleFilterOptionsChange = (priority?: string, readStatus?: string, date?: string) => {
    if (priority) setPriorityFilter(priority);
    if (readStatus) setReadFilter(readStatus);
    if (date) setDateFilter(date);
  };

  // Handler to open composer
  const handleNewMessage = () => {
    setShowComposer(true);
    setSelectedMessageId(null);
  };

  // Handler to close composer
  const handleCloseComposer = () => {
    setShowComposer(false);
  };

  // Handler for contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowComposer(true);
    setSelectedMessageId(null);
  };

  // Handler for message selection
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    setShowComposer(false);
  };

  // Handler for reply
  const handleReply = () => {
    setShowComposer(true);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Left column - Contacts */}
      <div className="w-1/4 border-r border-gray-200 flex flex-col">
        <ContactSidebar 
          branchId={branchId || "1"}
          onContactSelect={handleContactSelect}
          contactType={filterType}
          onContactTypeChange={(type) => setFilterType(type)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
      </div>
      
      {/* Middle column - Message list */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Messages</h3>
          <MessageFilters 
            selectedFilter={filterType}
            onFilterChange={(filter) => setFilterType(filter as "all" | "carers" | "clients" | "groups")}
            priorityFilter={priorityFilter}
            readFilter={readFilter}
            dateFilter={dateFilter}
            onFilterOptionsChange={handleFilterOptionsChange}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <MessageList 
            branchId={branchId || "1"}
            onMessageSelect={handleMessageSelect}
            selectedMessageId={selectedMessageId}
            selectedFilter={filterType}
            searchTerm={searchTerm}
            priorityFilter={priorityFilter}
            readFilter={readFilter}
            dateFilter={dateFilter}
          />
        </div>
        <div className="p-3 border-t border-gray-200">
          <Button className="w-full flex items-center justify-center" onClick={handleNewMessage}>
            <Plus className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>
      
      {/* Right column - Message view or composer */}
      <div className="flex-1 flex flex-col">
        {showComposer ? (
          <MessageComposer 
            branchId={branchId || "1"}
            onClose={handleCloseComposer}
            selectedContactId={selectedContactId}
          />
        ) : selectedMessageId ? (
          <MessageView 
            messageId={selectedMessageId}
            onReply={handleReply}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <p className="text-gray-400 mb-4">Select a message to view or start a new conversation</p>
            <Button variant="outline" onClick={handleNewMessage}>
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
