
import React, { useState } from "react";
import { ContactSidebar } from "./ContactSidebar";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { MessageComposer } from "./MessageComposer";
import { MessageFilters } from "./MessageFilters";
import { MessageInputBar } from "./MessageInputBar";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScheduledMessagesView } from "./ScheduledMessagesView";
import { DraftMessagesView } from "./DraftMessagesView";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ 
  branchId = "1", 
  branchName = "Med-Infinite" 
}) => {
  const { data: currentUser, isLoading: userLoading } = useUserRole();
  const queryClient = useQueryClient();
  
  // State management
  const [activeTab, setActiveTab] = useState("messages");
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState<any | null>(null);
  const [filterType, setFilterType] = useState<"all" | "carers" | "clients" | "admins" | "groups">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [readFilter, setReadFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Check for thread to open from notification on component mount
  React.useEffect(() => {
    const threadIdToOpen = sessionStorage.getItem('openThreadId');
    if (threadIdToOpen) {
      setSelectedMessageId(threadIdToOpen);
      setShowComposer(false);
      sessionStorage.removeItem('openThreadId');
    }
  }, []);

  // Set up real-time subscriptions for admin messaging
  React.useEffect(() => {
    const channel = supabase
      .channel('admin-messages-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Admin message update received:', payload);
          // Invalidate admin message-related queries
          queryClient.invalidateQueries({ queryKey: ['message-threads'] });
          queryClient.invalidateQueries({ queryKey: ['admin-thread-messages'] });
          
          // Auto-refresh notifications to show new message indicators
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads'
        },
        (payload) => {
          console.log('Admin thread update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['message-threads'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_read_status'
        },
        (payload) => {
          console.log('Message read status update received:', payload);
          // Invalidate read receipt queries to update tick indicators
          queryClient.invalidateQueries({ queryKey: ['message-read-receipts'] });
          queryClient.invalidateQueries({ queryKey: ['message-threads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
    setDraftToEdit(null);
  };

  // Handler to use a draft
  const handleUseDraft = (draft: any) => {
    setDraftToEdit(draft);
    setActiveTab("messages");
    setShowComposer(true);
    setSelectedMessageId(null);
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

  // Handler for reply - no longer needed as input is always visible
  const handleReply = () => {
    // No-op: input bar is always visible
  };

  if (userLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-card rounded-lg border border-border shadow-sm overflow-hidden items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-[calc(100vh-4rem)] bg-card rounded-lg border border-border shadow-sm overflow-hidden items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground text-lg mb-2">Authentication Required</div>
          <p className="text-sm text-muted-foreground">
            Please log in to access the messaging system.
          </p>
        </div>
      </div>
    );
  }

  // Adjust available filter types based on user role
  const getAvailableFilterTypes = () => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'branch_admin') {
      return ['all', 'carers', 'clients', 'admins', 'groups'];
    } else {
      return ['all', 'admins', 'groups']; // Carers and clients can only see admins and groups
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col">
        <div className="border-b px-4 bg-card">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="messages" className="flex-1 m-0 flex overflow-hidden">
          {/* Left column - Contacts */}
          <div className="w-1/4 border-r border-border flex flex-col">
            <ContactSidebar 
              branchId={branchId || "1"}
              onContactSelect={handleContactSelect}
              contactType={filterType}
              onContactTypeChange={(type) => {
                const availableTypes = getAvailableFilterTypes();
                if (availableTypes.includes(type)) {
                  setFilterType(type);
                }
              }}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>
          
          {/* Middle column - Message list */}
          <div className="w-1/3 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold mb-4">Messages</h3>
              <MessageFilters 
                selectedFilter={filterType}
                onFilterChange={(filter) => {
                  const availableTypes = getAvailableFilterTypes();
                  if (availableTypes.includes(filter)) {
                    setFilterType(filter as "all" | "carers" | "clients" | "admins" | "groups");
                  }
                }}
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
            <div className="p-3 border-t border-border">
              <Button className="w-full flex items-center justify-center" onClick={handleNewMessage}>
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
          
          {/* Right column - Message view or composer */}
          <div className="flex-1 flex flex-col">
            {showComposer && !selectedMessageId ? (
              <MessageComposer 
                branchId={branchId || "1"}
                onClose={handleCloseComposer}
                selectedContactId={selectedContactId}
                selectedThreadId={selectedMessageId}
                initialDraft={draftToEdit}
              />
            ) : selectedMessageId ? (
              <div className="flex flex-col h-full min-h-0">
                {/* Messages area - constrained to scroll */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <MessageView 
                    messageId={selectedMessageId}
                    onReply={handleReply}
                  />
                </div>
                {/* Input bar - always visible at bottom */}
                <MessageInputBar threadId={selectedMessageId} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-muted">
                <p className="text-muted-foreground mb-4">Select a message to view or start a new conversation</p>
                <Button variant="outline" onClick={handleNewMessage}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Message
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="scheduled" className="flex-1 m-0 min-h-0 overflow-hidden">
          <ScheduledMessagesView branchId={branchId} />
        </TabsContent>
        
        <TabsContent value="drafts" className="flex-1 m-0 min-h-0 overflow-hidden">
          <DraftMessagesView onUseDraft={handleUseDraft} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
