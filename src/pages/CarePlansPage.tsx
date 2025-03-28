
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useParams } from "react-router-dom";
import { CarePlansTable } from "@/components/careplans/CarePlansTable";

const CarePlansPage = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  const [activeTab, setActiveTab] = useState("care-plan");
  
  // Handle New Booking button click
  const handleNewBooking = () => {
    console.log("New booking clicked");
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex-1 container mx-auto px-4 py-8">
        <BranchInfoHeader
          branchName={decodeURIComponent(branchName || "")}
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-8">
          <TabNavigation 
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          
          <div className="mt-6">
            <CarePlansTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarePlansPage;
