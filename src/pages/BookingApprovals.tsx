
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import AppointmentApprovalList from "@/components/bookings/AppointmentApprovalList";

const BookingApprovals: React.FC = () => {
  const [activeTab, setActiveTab] = useState("cancellations");
  
  return (
    <div className="container mx-auto p-6">
      <DashboardHeader />
      
      <div className="mt-6">
        <h1 className="text-2xl font-bold">Booking Approvals</h1>
        <p className="text-gray-500 mt-1">Manage cancellation requests and reallocations</p>
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
          />
          
          <div className="mt-6">
            <AppointmentApprovalList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingApprovals;
