
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
// Include any other imports that the component needs

const FormMatrix = () => {
  const [activeTab, setActiveTab] = useState("form-matrix");
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChangeTab = (value: string) => {
    setActiveTab(value);
    
    if (id && branchName) {
      // Branch context navigation
      navigate(`/branch-dashboard/${id}/${branchName}/${value === "dashboard" ? "" : value}`);
    } else {
      // Global context navigation
      if (value.includes("matrix") || value === "workflow") {
        navigate(`/workflow/${value}`);
      } else {
        navigate(`/${value}`);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <BranchHeader 
          id={id} 
          branchName={branchName} 
          onNewBooking={() => {}}
        />
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Form Matrix</h1>
              <p className="text-gray-500 mt-1">Track client form completion and documentation status</p>
            </div>
          </div>
          
          <div className="p-8 text-center text-gray-500">
            Form Matrix content will be implemented soon
          </div>
        </div>
      </main>
    </div>
  );
};

export default FormMatrix;
