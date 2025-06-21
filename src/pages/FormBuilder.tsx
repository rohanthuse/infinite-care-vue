
import React, { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchInfoHeader } from "@/components/BranchInfoHeader";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TabNavigation } from "@/components/TabNavigation";
import { FormBuilderTab } from "@/components/form-builder/FormBuilderTab";

const FormBuilder = () => {
  const { id, branchName, formId } = useParams();
  const navigate = useNavigate();
  const [activeNavTab, setActiveNavTab] = useState("form-builder");
  const decodedBranchName = decodeURIComponent(branchName || "Med-Infinite Branch");

  useEffect(() => {
    document.title = `Form Builder | ${decodedBranchName}`;
  }, [decodedBranchName]);
  
  const handleNavTabChange = (value: string) => {
    setActiveNavTab(value);
    
    if (value !== "form-builder") {
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
        
        <FormBuilderTab 
          branchId={id || ""} 
          selectedFormId={formId}
        />
      </main>
    </div>
  );
};

export default FormBuilder;
