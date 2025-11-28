
import React, { useState } from "react";
import { MessageCircle } from "lucide-react";
import { CarerContactSidebar } from "@/components/carer/CarerContactSidebar";
import { CarerMessageList } from "@/components/carer/CarerMessageList";
import { CarerMessageView } from "@/components/carer/CarerMessageView";
import { CarerMessageComposerEnhanced } from "@/components/carer/CarerMessageComposerEnhanced";
import { useCarerMessageNotifications } from "@/hooks/useCarerMessageNotifications";

const CarerMessages = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [contactType, setContactType] = useState<"all" | "assigned" | "branch">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  // Enable real-time notifications
  useCarerMessageNotifications();

  const handleContactSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    setSelectedMessageId(null);
    setShowComposer(true);
  };

  const handleMessageSelect = (messageId: string) => {
    setSelectedMessageId(messageId);
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
    <div className="w-full min-w-0 max-w-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <MessageCircle className="h-5 w-5 md:h-6 md:w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-bold text-card-foreground">Messages</h1>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden border border-gray-200 rounded-lg bg-white">
        {/* Left Panel - Contact Sidebar */}
        <div className="hidden lg:flex flex-col w-64 border-r border-gray-200">
          <CarerContactSidebar
            onContactSelect={handleContactSelect}
            contactType={contactType}
            onContactTypeChange={setContactType}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        {/* Middle Panel - Message List */}
        <div className="flex flex-col w-full sm:w-80 lg:w-96 border-r border-gray-200">
          <CarerMessageList
            selectedContactId={selectedContactId}
            selectedMessageId={selectedMessageId}
            onMessageSelect={handleMessageSelect}
            onComposeClick={handleComposeClick}
            searchTerm={searchTerm}
            isComposing={showComposer}
          />
        </div>

        {/* Right Panel - Message View or Composer */}
        <div className="hidden sm:flex flex-col flex-1 min-w-0">
          {showComposer ? (
            <CarerMessageComposerEnhanced
              selectedContactId={selectedContactId}
              selectedThreadId={selectedMessageId}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedMessageId ? (
            <CarerMessageView
              threadId={selectedMessageId}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
              <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Select a conversation</h3>
              <p className="text-sm text-gray-500 text-center max-w-md">
                Choose a conversation from the list to view messages, or start a new conversation by clicking the "New" button.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarerMessages;
