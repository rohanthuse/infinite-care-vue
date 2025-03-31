import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { ContactSidebar } from "./ContactSidebar";
import { MessageComposer } from "./MessageComposer";
import { MessageFilters } from "./MessageFilters";

export interface CommunicationsTabProps {
  branchId?: string;
  branchName?: string;
}

export const CommunicationsTab: React.FC<CommunicationsTabProps> = ({ branchId, branchName }) => {
  return (
    <div className="flex h-full w-full">
      <ContactSidebar />
      <div className="flex flex-col flex-1">
        <MessageFilters />
        <Tabs defaultValue="inbox" className="flex flex-col flex-1">
          <TabsList className="border-b">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          <div className="flex flex-1">
            <TabsContent value="inbox" className="flex-1">
              <MessageList />
            </TabsContent>
            <TabsContent value="sent" className="flex-1">
              <MessageList />
            </TabsContent>
            <TabsContent value="drafts" className="flex-1">
              <MessageList />
            </TabsContent>
            <MessageView />
          </div>
        </Tabs>
        <MessageComposer />
      </div>
    </div>
  );
};
