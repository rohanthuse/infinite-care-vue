
import React, { useState, useEffect, memo } from "react";
import { ClientContactSidebar } from "@/components/client/ClientContactSidebar";
import { ClientMessageList } from "@/components/client/ClientMessageList";
import { ClientMessageView } from "@/components/client/ClientMessageView";
import { ClientMessageComposer } from "@/components/client/ClientMessageComposer";

// Memoize components to prevent unnecessary re-renders
const MemoizedContactSidebar = memo(ClientContactSidebar);
const MemoizedMessageList = memo(ClientMessageList);
const MemoizedMessageView = memo(ClientMessageView);
const MemoizedMessageComposer = memo(ClientMessageComposer);

const ClientMessages = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<"all" | "carers" | "admins">("all"); // Keep for compatibility but will only show admins
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Delay initial loading to prevent UI blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    // Reset selected message when changing contacts
    setSelectedMessageId(null);
    // Show composer when selecting a contact
    setShowComposer(true);
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
    // Refresh message list by clearing selected contact temporarily
    const currentContact = selectedContactId;
    setSelectedContactId(null);
    setTimeout(() => setSelectedContactId(currentContact), 100);
  };

  const handleReply = () => {
    setShowComposer(true);
  };
  
  if (!isLoaded) {
    return <div className="flex items-center justify-center h-full">
      <div className="animate-pulse flex space-x-4">
        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-36"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
    </div>;
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Sidebar - Contact list */}
        <div className="w-full md:w-64 border-r border-gray-200 flex flex-col bg-white rounded-l-md shadow-sm">
          <MemoizedContactSidebar 
            onContactSelect={handleContactSelect}
            contactType={contactType}
            onContactTypeChange={setContactType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        {/* Messages list column */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white md:flex min-h-0">
          <MemoizedMessageList 
            selectedContactId={selectedContactId}
            selectedMessageId={selectedMessageId}
            onMessageSelect={handleMessageSelect}
            onComposeClick={handleComposeClick}
            searchTerm={searchTerm}
          />
        </div>
        
        {/* Message view or composer */}
        <div className="flex-1 bg-white rounded-r-md shadow-sm flex flex-col min-h-0">
          {showComposer ? (
            <MemoizedMessageComposer
              selectedContactId={selectedContactId}
              selectedThreadId={selectedMessageId}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedMessageId ? (
            <MemoizedMessageView 
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
