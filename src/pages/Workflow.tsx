
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";
import WorkflowContent from "@/components/workflow/WorkflowContent";

const Workflow = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("workflow");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  useEffect(() => {
    document.title = `Workflow Management | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "workflow") {
      if (id && branchName) {
        navigate(`/admin/branch-dashboard/${id}/${encodeURIComponent(decodedBranchName)}/${value}`);
      } else {
        navigate(`/admin/${value}`);
      }
    }
  };
  
  const handleNewBooking = () => {
    toast.info("New booking functionality will be implemented soon");
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
        
        <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-2xl font-bold">Workflow Management</h2>
            <p className="text-gray-500 mt-1">Manage and monitor all workflow processes and notifications</p>
          </div>
          
          <div className="p-6">
            <WorkflowContent branchId={id} branchName={branchName} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Workflow;
