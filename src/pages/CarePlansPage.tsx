
import React from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useParams } from "react-router-dom";
import { CarePlansTable } from "@/components/careplans/CarePlansTable";

const CarePlansPage = () => {
  const { id, branchName } = useParams<{ id: string; branchName: string }>();
  
  const tabs = [
    { id: "careplans", label: "Care Plans", isActive: true },
    { id: "templates", label: "Templates", isActive: false },
    { id: "settings", label: "Settings", isActive: false },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex-1 container mx-auto px-4 py-8">
        <BranchInfoHeader
          id={id || ""}
          branchName={decodeURIComponent(branchName || "")}
          currentPage="Care Plans"
        />
        
        <div className="mt-8">
          <TabNavigation tabs={tabs} />
          
          <div className="mt-6">
            <CarePlansTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarePlansPage;
