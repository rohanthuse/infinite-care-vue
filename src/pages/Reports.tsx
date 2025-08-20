
import React from "react";
import { BranchLayout } from "@/components/branch-dashboard/BranchLayout";
import { ReportsContent } from "@/components/reports/ReportsContent";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Reports = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  // Set page title
  React.useEffect(() => {
    document.title = `Reports | ${decodedBranchName}`;
  }, [decodedBranchName]);

  // Handler for the "New Booking" button
  const handleNewBooking = () => {
    // Navigate to the bookings page with a query parameter to open the new booking dialog
    navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/bookings?new=true`);
    
    // Show a success toast notification
    toast.success("Redirecting to create a new booking", {
      description: "You'll be able to create a new booking on the bookings page",
    });
  };

  return (
    <BranchLayout onNewBooking={handleNewBooking}>
      <ReportsContent branchId={id || ""} branchName={decodedBranchName} />
    </BranchLayout>
  );
};

export default Reports;
