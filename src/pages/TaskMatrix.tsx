
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import { CheckSquare } from "lucide-react";

const TaskMatrix = () => {
  const [activeTab, setActiveTab] = useState("task-matrix");
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
        {id && branchName && (
          <BranchHeader 
            id={id} 
            branchName={branchName} 
            onNewBooking={() => {}}
          />
        )}
        
        <TabNavigation 
          activeTab={activeTab} 
          onChange={handleChangeTab}
        />
        
        <div className="mt-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Task Matrix</h1>
              <p className="text-gray-500 mt-1">Track task completion and compliance status</p>
            </div>
          </div>
          
          <div className="p-8 bg-white rounded-lg border border-gray-200 shadow-sm text-center">
            <CheckSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Task Matrix</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Task Matrix content will be implemented soon. This page will display task completion and compliance tracking.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
