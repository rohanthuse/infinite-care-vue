
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { EventLogsList } from "@/components/events-logs/EventLogsList";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const EventsLogs = () => {
  const { id, branchName } = useParams();
  const [activeTab, setActiveTab] = useState("new");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full">
        <BranchInfoHeader 
          branchName={decodeURIComponent(branchName || "Med-Infinite Branch")} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Events & Logs</h2>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="sticky top-0 z-10 w-full grid grid-cols-2 bg-white p-4 border-b border-gray-100">
              <TabsTrigger value="new">New Event/Log</TabsTrigger>
              <TabsTrigger value="view">View Events/Logs</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="h-[calc(100vh-280px)] overflow-auto">
              <TabsContent value="new" className="p-6 focus:outline-none">
                <EventLogForm branchId={id || ""} />
              </TabsContent>
              <TabsContent value="view" className="p-6 focus:outline-none">
                <EventLogsList branchId={id || ""} />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EventsLogs;
