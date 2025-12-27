
import React, { useState, useEffect } from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { LibraryResourcesList } from "@/components/library/LibraryResourcesList";
import { LibraryResourceForm } from "@/components/library/LibraryResourceForm";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useServices } from "@/data/hooks/useServices";
import { useTenant } from "@/contexts/TenantContext";

const Library = () => {
  const { id, branchName } = useParams();
  const branchId = id || "";
  const { organization } = useTenant();
  const [activeTab, setActiveTab] = useState("view");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId);
  const { data: services = [] } = useServices(organization?.id);

  // Set page title
  useEffect(() => {
    document.title = `Library | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleResourceAdded = () => {
    // Switch to the view tab after a resource is added successfully
    setActiveTab("view");
    toast.success("Resource added successfully to the library");
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
      <div className="bg-card rounded-lg border border-border shadow-sm flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground">Library Resources</h2>
          <p className="text-muted-foreground mt-1">Add, manage and share educational and reference materials</p>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange} 
          className="w-full flex flex-col flex-1"
        >
          <div className="bg-muted border-b border-border p-1.5 sm:p-2.5 sticky top-0 z-20">
            <TabsList className="w-full grid grid-cols-2 rounded-md overflow-hidden bg-muted p-0.5 sm:p-1">
              <TabsTrigger 
                value="add" 
                className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
              >
                Add Resource
              </TabsTrigger>
              <TabsTrigger 
                value="view" 
                className="text-base font-medium py-2.5 rounded-md transition-all duration-200 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:bg-green-500"
              >
                Browse Resources
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent 
              value="add" 
              className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
            >
              <div className="p-4 md:p-6 max-w-full">
                <LibraryResourceForm 
                  branchId={id || ""} 
                  onResourceAdded={handleResourceAdded}
                />
              </div>
            </TabsContent>
            <TabsContent 
              value="view" 
              className="p-0 focus:outline-none m-0 h-full overflow-y-auto"
            >
              <div className="p-4 md:p-6 max-w-full">
                <LibraryResourcesList 
                  branchId={id || ""} 
                  onAddNew={() => handleTabChange("add")}
                />
              </div>
            </TabsContent>
          </div>
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

export default Library;
