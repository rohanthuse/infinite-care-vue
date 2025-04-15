
import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { ReportsContent } from "@/components/reports/ReportsContent";
import { useParams, useNavigate } from "react-router-dom";

const Reports = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("reports");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  // Set page title
  React.useEffect(() => {
    document.title = `Reports | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    // Navigate to the appropriate route based on the selected tab
    if (value !== "reports") {
      navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6">
          <ReportsContent branchId={id || ""} branchName={decodedBranchName} />
        </div>
      </main>
    </div>
  );
};

export default Reports;
