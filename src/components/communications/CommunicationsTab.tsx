import React, { useState, useEffect } from "react";
import { MessageList } from "./MessageList";
import { ContactSidebar } from "./ContactSidebar";
import { MessageComposer } from "./MessageComposer";
import { MessageView } from "./MessageView";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MessageFilters } from "./MessageFilters";
import { useToast } from "@/hooks/use-toast";

export interface CommunicationsTabProps {
  branchId: string;
}

export const CommunicationsTab = ({ branchId }: CommunicationsTabProps) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<"all" | "carers" | "clients">("all");
  const [isComposing, setIsComposing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>("all");
  const [readFilter, setReadFilter] = useState<string | undefined>("all");
  const [dateFilter, setDateFilter] = useState<string | undefined>("all");
  
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  
  const handleComposeNew = () => {
    setIsComposing(true);
    setSelectedMessageId(null);
  };
  
  const handleCloseComposer = () => {
    setIsComposing(false);
  };
  
  const handleMessageSelect = (messageId: string) => {
    if (messageId) {
      setSelectedMessageId(messageId);
      setIsComposing(false);
    }
  };
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    if (isMobile) {
      setIsComposing(true);
    }
  };

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
  };

  const handleFilterOptionsChange = (
    priority?: string,
    readStatus?: string,
    date?: string
  ) => {
    setPriorityFilter(priority);
    setReadFilter(readStatus);
    setDateFilter(date);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="flex h-[calc(100vh-230px)] min-h-[500px]">
        {(!isMobile || (!selectedMessageId && !isComposing)) && (
          <div className="w-full md:w-64 lg:w-80 border-r border-gray-200 flex flex-col">
            <ContactSidebar 
              branchId={branchId} 
              onContactSelect={handleContactSelect}
              contactType={contactType}
              onContactTypeChange={setContactType}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
        )}
        
        {(!isMobile || (selectedMessageId === null && !isComposing)) && (
          <div className={`${isMobile ? 'w-full' : isTablet ? 'w-1/2' : 'w-1/3'} border-r border-gray-200 flex flex-col`}>
            <div className="p-4 border-b border-gray-200">
              <MessageFilters
                selectedFilter={selectedFilter}
                onFilterChange={handleFilterChange}
                priorityFilter={priorityFilter}
                readFilter={readFilter}
                dateFilter={dateFilter}
                onFilterOptionsChange={handleFilterOptionsChange}
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageList 
                branchId={branchId}
                onMessageSelect={handleMessageSelect}
                selectedMessageId={selectedMessageId}
                selectedFilter={selectedFilter}
                searchTerm={searchTerm}
                priorityFilter={priorityFilter}
                readFilter={readFilter}
                dateFilter={dateFilter}
              />
            </div>
            <div className="p-3 border-t border-gray-200">
              <Button 
                onClick={handleComposeNew} 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        )}
        
        {((!isMobile && (selectedMessageId || isComposing)) || 
          (isMobile && (selectedMessageId || isComposing))) && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} flex flex-col relative`}>
            {isMobile && (
              <div className="absolute top-3 left-3 z-10">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    setSelectedMessageId(null);
                    setIsComposing(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {selectedMessageId && !isComposing ? (
              <MessageView 
                messageId={selectedMessageId} 
                onReply={() => setIsComposing(true)}
              />
            ) : (
              <MessageComposer 
                branchId={branchId}
                onClose={handleCloseComposer}
                selectedContactId={selectedContactId}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
