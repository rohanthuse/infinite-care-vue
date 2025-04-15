
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { EventLogsList } from "@/components/events-logs/EventLogsList";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";

const EventsLogs = () => {
  const { id, branchName } = useParams();
  const [activeTab, setActiveTab] = useState("view");
  const [activeNavTab, setActiveNavTab] = useState("events-logs");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-20 md:py-6 w-full overflow-hidden">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-[calc(100vh-250px)]">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Events & Logs</h2>
          </div>
          
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange} 
            className="w-full flex flex-col flex-1"
          >
            <div className="bg-gray-50 border-b border-gray-100 p-1.5 sm:p-2.5 sticky top-0 z-10">
              <TabsList className="w-full grid grid-cols-2 rounded-md overflow-hidden bg-gray-100/80 p-0.5 sm:p-1">
                <TabsTrigger 
                  value="new" 
                  className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:bg-white"
                >
                  New Event/Log
                </TabsTrigger>
                <TabsTrigger 
                  value="view" 
                  className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:bg-white"
                >
                  View Events/Logs
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent 
                value="new" 
                className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
              >
                <div className="p-4 md:p-6 max-w-full overflow-x-hidden">
                  <EventLogForm branchId={id || ""} />
                </div>
              </TabsContent>
              <TabsContent 
                value="view" 
                className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
              >
                <div className="p-4 md:p-6 max-w-full">
                  <EventLogsList branchId={id || ""} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EventsLogs;
