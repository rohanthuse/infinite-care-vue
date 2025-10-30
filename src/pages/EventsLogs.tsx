import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventLogForm } from "@/components/events-logs/EventLogForm";
import { EventLogsList } from "@/components/events-logs/EventLogsList";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useServices } from "@/data/hooks/useServices";

const EventsLogs = () => {
  const [activeTab, setActiveTab] = useState("view");
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const branchId = id || "";
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId);
  const { data: services = [] } = useServices();

  useEffect(() => {
    if (branchName) {
      document.title = `Events & Logs - ${decodeURIComponent(branchName)}`;
    }
  }, [branchName]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleNewClient = () => setAddClientDialogOpen(true);
  const handleNewBooking = () => setNewBookingDialogOpen(true);
  const handleClientAdded = () => {};
  const handleCreateBooking = (bookingData: any) => {
    console.log("Creating new booking:", bookingData);
    setNewBookingDialogOpen(false);
  };

  return (
    <>
      <BranchLayout onNewClient={handleNewClient} onNewBooking={handleNewBooking}>
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
    
    <AddClientDialog
      open={addClientDialogOpen}
      onOpenChange={setAddClientDialogOpen}
      branchId={branchId}
      onSuccess={handleClientAdded}
    />
    
    <NewBookingDialog
      open={newBookingDialogOpen}
      onOpenChange={setNewBookingDialogOpen}
      carers={carers}
      services={services}
      onCreateBooking={handleCreateBooking}
      branchId={branchId}
    />
  </>
  );
};

export default EventsLogs;