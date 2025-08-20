import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { EventLogsList } from "@/components/events-logs/EventLogsList";

const EventsLogs = () => {
  const [activeTab, setActiveTab] = useState("new");
  const { id, branchName } = useParams<{ id: string; branchName: string }>();

  useEffect(() => {
    if (branchName) {
      document.title = `Events & Logs - ${decodeURIComponent(branchName)}`;
    }
  }, [branchName]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <BranchLayout>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1">Events & Logs</h2>
        <p className="text-sm text-muted-foreground mb-4">Record and manage branch events and activity logs</p>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-2">
          <TabsList className="grid grid-cols-2 mb-6 w-full lg:w-auto">
            <TabsTrigger value="new" className="flex items-center gap-1">
              <span>New Event/Log</span>
            </TabsTrigger>
            <TabsTrigger value="view" className="flex items-center gap-1">
              <span>View Events/Logs</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="new" className="space-y-6">
            <EventLogForm branchId={id || ''} />
          </TabsContent>
          
          <TabsContent value="view" className="space-y-6">
            <EventLogsList branchId={id || ''} />
          </TabsContent>
        </Tabs>
      </div>
    </BranchLayout>
  );
};

export default EventsLogs;