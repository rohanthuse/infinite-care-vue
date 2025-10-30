
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import AccountingTab from "@/components/accounting/AccountingTab";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useServices } from "@/data/hooks/useServices";

const Accounting = () => {
  const { id } = useParams();
  const branchId = id || "";
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId);
  const { data: services = [] } = useServices();
  
  console.log('[Accounting] Component rendered successfully');
  
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
        <AccountingTab />
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

export default Accounting;
