
import React, { useState } from "react";
import { ClientContactSidebar } from "@/components/client/ClientContactSidebar";
import { ClientMessageList } from "@/components/client/ClientMessageList";
import { ClientMessageView } from "@/components/client/ClientMessageView";
import { ClientMessageComposer } from "@/components/client/ClientMessageComposer";

const ClientMessages = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<"all" | "carers" | "admins">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    // Reset selected message when changing contacts
    setSelectedMessageId(null);
  };
  
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    // Close composer when selecting a message
    setShowComposer(false);
  };
  
  const handleComposeClick = () => {
    setShowComposer(true);
    setSelectedMessageId(null);
  };
  
  const handleSendMessage = () => {
    setShowComposer(false);
  };
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar - Contact list */}
        <div className="w-full md:w-64 border-r border-gray-200 flex flex-col bg-white rounded-l-md shadow-sm">
          <ClientContactSidebar 
            onContactSelect={handleContactSelect}
            contactType={contactType}
            onContactTypeChange={setContactType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        {/* Messages list column */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white md:flex">
          <ClientMessageList 
            selectedContactId={selectedContactId}
            selectedMessageId={selectedMessageId}
            onMessageSelect={handleMessageSelect}
            onComposeClick={handleComposeClick}
            searchTerm={searchTerm}
          />
        </div>
        
        {/* Message view or composer */}
        <div className="flex-1 bg-white rounded-r-md shadow-sm flex flex-col">
          {showComposer ? (
            <ClientMessageComposer
              selectedContactId={selectedContactId}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedMessageId ? (
            <ClientMessageView 
              messageId={selectedMessageId}
              onReply={handleComposeClick}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
              <div className="text-gray-400 text-lg mb-2">No message selected</div>
              <p className="text-sm text-gray-500 max-w-md text-center">
                Select a message from the list to view it, or start a new conversation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
