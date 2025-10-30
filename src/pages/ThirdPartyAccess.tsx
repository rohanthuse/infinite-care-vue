
import React, { useState, useEffect } from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { useParams } from "react-router-dom";
import { ThirdPartyAccessManagement } from "@/components/third-party-access/ThirdPartyAccessManagement";
import { AddClientDialog } from "@/components/AddClientDialog";
import { NewBookingDialog } from "@/components/bookings/dialogs/NewBookingDialog";
import { useBookingData } from "@/components/bookings/hooks/useBookingData";
import { useServices } from "@/data/hooks/useServices";

const ThirdPartyAccess = () => {
  const { id, branchName } = useParams();
  const branchId = id || "";
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  
  const { clients, carers } = useBookingData(branchId);
  const { data: services = [] } = useServices();

  // Set page title
  useEffect(() => {
    document.title = `Third Party Access | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
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
        <ThirdPartyAccessManagement branchId={branchId} />
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

export default ThirdPartyAccess;
