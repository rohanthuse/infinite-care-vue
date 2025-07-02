
import React, { useState, useEffect, memo } from "react";
import { UnifiedMessageList } from "./UnifiedMessageList";
import { UnifiedMessageView } from "./UnifiedMessageView";
import { UnifiedMessageComposer } from "./UnifiedMessageComposer";
import { useUnifiedUser } from "@/hooks/useUnifiedMessaging";

// Memoize components to prevent unnecessary re-renders
const MemoizedMessageList = memo(UnifiedMessageList);
const MemoizedMessageView = memo(UnifiedMessageView);
const MemoizedMessageComposer = memo(UnifiedMessageComposer);

interface UniversalMessagingProps {
  className?: string;
}

export const UniversalMessaging = ({ className = "" }: UniversalMessagingProps) => {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showComposer, setShowComposer] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user, loading: userLoading } = useUnifiedUser();
  
  // Delay initial loading to prevent UI blocking
  useEffect(() => {
    if (!userLoading) {
      const timer = setTimeout(() => {
        setIsLoaded(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [userLoading]);
  
  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setShowComposer(false);
  };
  
  const handleComposeClick = () => {
    setShowComposer(true);
    setSelectedThreadId(null);
  };
  
  const handleSendMessage = () => {
    setShowComposer(false);
  };

  const handleReply = () => {
    setShowComposer(true);
  };
  
  if (userLoading || !isLoaded) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-36"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">Authentication Required</div>
          <p className="text-sm text-gray-500">Please log in to access messaging.</p>
        </div>
      </div>
    );
  }

  const getComposeButtonText = () => {
    switch (user.role) {
      case 'client':
        return 'Message Care Coordinator';
      case 'carer':
        return 'Message Administrator';
      case 'branch_admin':
        return 'New Message';
      case 'super_admin':
        return 'New Message';
      default:
        return 'New Message';
    }
  };

  const getEmptyStateText = () => {
    switch (user.role) {
      case 'client':
        return 'Select a message from the list to view it, or start a new conversation with your care coordinators.';
      case 'carer':
        return 'Select a message from the list to view it, or start a new conversation with administrators.';
      case 'branch_admin':
        return 'Select a message from the list to view it, or start a new conversation with clients and carers.';
      case 'super_admin':
        return 'Select a message from the list to view it, or start a new conversation.';
      default:
        return 'Select a message from the list to view it, or start a new conversation.';
    }
  };
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row min-h-0">
        {/* Messages list column */}
        <div className="w-full md:w-80 lg:w-96 border-r border-gray-200 flex flex-col bg-white md:flex min-h-0">
          <MemoizedMessageList 
            selectedThreadId={selectedThreadId}
            onThreadSelect={handleThreadSelect}
            onComposeClick={handleComposeClick}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
        
        {/* Message view or composer */}
        <div className="flex-1 bg-white rounded-r-md shadow-sm flex flex-col min-h-0">
          {showComposer ? (
            <MemoizedMessageComposer
              selectedThreadId={selectedThreadId}
              onClose={() => setShowComposer(false)}
              onSend={handleSendMessage}
            />
          ) : selectedThreadId ? (
            <MemoizedMessageView 
              threadId={selectedThreadId}
              onReply={handleReply}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
              <div className="text-gray-400 text-lg mb-2">No message selected</div>
              <p className="text-sm text-gray-500 max-w-md text-center">
                {getEmptyStateText()}
              </p>
              <button 
                onClick={handleComposeClick}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {getComposeButtonText()}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
