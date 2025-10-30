
import React, { useState } from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { ReportsContent } from "@/components/reports/ReportsContent";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AddClientDialog } from "@/components/AddClientDialog";

const Reports = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");
  const [addClientDialogOpen, setAddClientDialogOpen] = useState(false);

  // Set page title
  React.useEffect(() => {
    document.title = `Reports | ${decodedBranchName}`;
  }, [decodedBranchName]);

  // Handler for the "New Client" button
  const handleNewClient = () => {
    setAddClientDialogOpen(true);
  };

  // Handler for the "New Booking" button
  const handleNewBooking = () => {
    // Navigate to the bookings page with a query parameter to open the new booking dialog
    navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/bookings?new=true`);
    
    // Show a success toast notification
    toast.success("Redirecting to create a new booking", {
      description: "You'll be able to create a new booking on the bookings page",
    });
  };

  const handleClientAdded = () => {
    // Client added successfully
  };

  return (
    <>
      <BranchLayout onNewBooking={handleNewBooking} onNewClient={handleNewClient}>
        <ReportsContent branchId={id || ""} branchName={decodedBranchName} />
      </BranchLayout>
      
      <AddClientDialog
        open={addClientDialogOpen}
        onOpenChange={setAddClientDialogOpen}
        branchId={id || ''}
        onSuccess={handleClientAdded}
      />
    </>
  );
};

export default Reports;
