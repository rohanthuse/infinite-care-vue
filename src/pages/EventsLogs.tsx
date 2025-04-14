
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { EventLogsList } from "@/components/events-logs/EventLogsList";
import { useParams } from "react-router-dom";

const EventsLogs = () => {
  const { id, branchName } = useParams();
  const [activeTab, setActiveTab] = useState("new");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodeURIComponent(branchName || "Med-Infinite Branch")} 
          branchId={id || ""}
        />
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6">Events & Logs</h2>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="new">New Event/Log</TabsTrigger>
              <TabsTrigger value="view">View Events/Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="new" className="w-full">
              <EventLogForm branchId={id || ""} />
            </TabsContent>
            <TabsContent value="view">
              <EventLogsList branchId={id || ""} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EventsLogs;
