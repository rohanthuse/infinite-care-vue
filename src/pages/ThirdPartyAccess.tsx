
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { useParams, useNavigate } from "react-router-dom";
import { ThirdPartyAccessForm } from "@/components/third-party-access/ThirdPartyAccessForm";
import { toast } from "sonner";

const ThirdPartyAccess = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("third-party");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  // Set page title
  useEffect(() => {
    document.title = `Third Party Access | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    // Navigate to the appropriate route based on the selected tab
    if (value !== "third-party") {
      navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
    }
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
  };

  const handleAccessRequestSubmitted = () => {
    toast.success("Third-party access request submitted successfully");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 px-4 md:px-8 pt-4 pb-8 md:py-6 w-full max-w-[1600px] mx-auto">
        <BranchInfoHeader 
          branchName={decodedBranchName} 
          branchId={id || ""}
          onNewBooking={handleNewBooking}
        />
        
        <div className="mt-6">
          <TabNavigation 
            activeTab={activeNavTab} 
            onChange={handleNavTabChange} 
            hideActionsOnMobile={true}
          />
        </div>
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Third-Party Access Management</h2>
            <p className="text-gray-500 mt-1">Create and manage access requests for external users</p>
          </div>
          
          <div className="p-4 md:p-6 max-w-full">
            <ThirdPartyAccessForm 
              branchId={id || ""} 
              onAccessSubmitted={handleAccessRequestSubmitted}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThirdPartyAccess;
