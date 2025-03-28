
import React, { useState } from "react";
import { ContactSidebar } from "./ContactSidebar";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { MessageComposer } from "./MessageComposer";
import { MessageFilters } from "./MessageFilters";
import { PlusCircle } from "lucide-react";
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
  const [filterType, setFilterType] = useState<"all" | "carers" | "clients">("all");
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
  };

  // Handler to close composer
  const handleCloseComposer = () => {
    setShowComposer(false);
  };

  // Handler for contact selection
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setShowComposer(true);
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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-4">Communications</h2>
      <p className="text-gray-500 mb-4">Branch: {branchName} (ID: {branchId})</p>
      
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <MessageFilters 
            selectedFilter={filterType}
            onFilterChange={(filter) => setFilterType(filter as "all" | "carers" | "clients")}
            priorityFilter={priorityFilter}
            readFilter={readFilter}
            dateFilter={dateFilter}
            onFilterOptionsChange={handleFilterOptionsChange}
          />
          <Button onClick={handleNewMessage} className="ml-2">
            <PlusCircle className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>
        
        <div className="flex h-[70vh] border border-gray-200 rounded-lg overflow-hidden">
          {/* Left sidebar - Contacts */}
          <div className="w-1/4 border-r border-gray-200 flex flex-col bg-white">
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
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-white">
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
          
          {/* Right column - Message view or composer */}
          <div className="flex-1 bg-white">
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
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
