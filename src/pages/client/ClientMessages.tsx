
import React, { useState } from "react";
import { ClientContactSidebar } from "@/components/client/ClientContactSidebar";
import { ClientMessageList } from "@/components/client/ClientMessageList";
import { ClientMessageView } from "@/components/client/ClientMessageView";
import { ClientMessageComposer } from "@/components/client/ClientMessageComposer";
import { useClientMessageNotifications } from "@/hooks/useClientMessageNotifications";

const ClientMessages = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<"all" | "carers" | "admins">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isReplyMode, setIsReplyMode] = useState(false);
  
  // Enable real-time message notifications
  useClientMessageNotifications();
  
  console.log('ClientMessages component loaded');
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    // Reset selected message when changing contacts
    setSelectedMessageId(null);
    // Show composer for new message when selecting a contact
    setIsReplyMode(false);
    setShowComposer(true);
  };
  
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    // Close composer when selecting a message
    setShowComposer(false);
    setIsReplyMode(false);
  };
  
  const handleComposeClick = () => {
    setShowComposer(true);
    setSelectedMessageId(null);
    setIsReplyMode(false);
  };
  
  const handleSendMessage = () => {
    setShowComposer(false);
    setIsReplyMode(false);
    // Refresh message list by clearing selected contact temporarily
    const currentContact = selectedContactId;
    setSelectedContactId(null);
    setTimeout(() => setSelectedContactId(currentContact), 100);
  };

  const handleReply = () => {
    setIsReplyMode(true);
    setShowComposer(true);
  };
  
  
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
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
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white md:flex min-h-0">
          <ClientMessageList 
            selectedContactId={selectedContactId}
            selectedMessageId={selectedMessageId}
            onMessageSelect={handleMessageSelect}
            onComposeClick={handleComposeClick}
            searchTerm={searchTerm}
            isComposing={showComposer}
          />
        </div>
        
        {/* Message view or composer */}
        <div className="flex-1 bg-white rounded-r-md shadow-sm flex flex-col min-h-0">
          {showComposer ? (
            <ClientMessageComposer
              selectedContactId={selectedContactId}
              selectedThreadId={isReplyMode ? selectedMessageId : null}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedMessageId ? (
            <ClientMessageView 
              messageId={selectedMessageId}
              onReply={handleReply}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
              <div className="text-gray-400 text-lg mb-2">No message selected</div>
              <p className="text-sm text-gray-500 max-w-md text-center">
                Select a message from the list to view it, or start a new conversation with your care coordinators.
              </p>
              <button 
                onClick={handleComposeClick}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Message Care Coordinator
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
