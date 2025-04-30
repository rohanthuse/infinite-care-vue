
import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import AppointmentApprovalList from "@/components/bookings/AppointmentApprovalList";

const BookingApprovals: React.FC = () => {
  const tabs = [
    { id: "cancellations", label: "Cancellation Requests" },
    { id: "reallocations", label: "Pending Reallocations" },
  ];

  return (
    <div className="container mx-auto p-6">
      <DashboardHeader heading="Booking Approvals" text="Manage cancellation requests and reallocations" />
      
      <div className="mt-6">
        <TabNavigation tabs={tabs} defaultTab="cancellations" />
        
        <div className="mt-6">
          <AppointmentApprovalList />
        </div>
      </div>
    </div>
  );
};

export default BookingApprovals;
