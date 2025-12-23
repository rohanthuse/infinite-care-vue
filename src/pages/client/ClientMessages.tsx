
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
  
  // Enable real-time message notifications
  useClientMessageNotifications();
  
  console.log('ClientMessages component loaded');
  
  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    // Reset selected message when changing contacts
    setSelectedMessageId(null);
    // Show composer for new message when selecting a contact
    setShowComposer(true);
  };
  
  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
    // Close composer when selecting a message (now reply is inline)
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
  
  
  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Sidebar - Contact list */}
        <div className="w-full md:w-64 border-r border-gray-200 dark:border-border flex flex-col bg-white dark:bg-card rounded-l-md shadow-sm">
          <ClientContactSidebar 
            onContactSelect={handleContactSelect}
            contactType={contactType}
            onContactTypeChange={setContactType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        {/* Messages list column */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 dark:border-border flex flex-col bg-white dark:bg-card md:flex min-h-0">
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
        <div className="flex-1 bg-white dark:bg-card rounded-r-md shadow-sm flex flex-col min-h-0">
          {showComposer ? (
            <ClientMessageComposer
              selectedContactId={selectedContactId}
              selectedThreadId={null}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedMessageId ? (
            <ClientMessageView 
              messageId={selectedMessageId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-muted/30">
              <div className="text-gray-400 dark:text-muted-foreground text-lg mb-2">No message selected</div>
              <p className="text-sm text-gray-500 dark:text-muted-foreground max-w-md text-center">
                Select a message from the list to view it, or start a new conversation with your care coordinators.
              </p>
              <button 
                onClick={handleComposeClick}
                className="mt-4 px-4 py-2 bg-blue-600 dark:bg-primary text-white rounded-md hover:bg-blue-700 dark:hover:bg-primary/90 transition-colors"
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
