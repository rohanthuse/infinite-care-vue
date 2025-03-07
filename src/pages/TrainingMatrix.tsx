
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import TrainingMatrixContent from "@/components/workflow/TrainingMatrixContent";

const TrainingMatrix = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  
  // Set activeTab to "training-matrix" explicitly
  const activeTab = "training-matrix";
  
  const handleChangeTab = (value: string) => {
    if (id && branchName) {
      if (value === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (value === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${value}`);
      }
    } else {
      if (value === "workflow") {
        navigate(`/workflow`);
      } else if (value === "task-matrix" || value === "training-matrix" || value === "form-matrix") {
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
          hideQuickAdd={true}
        />
        
        <div className="mt-6">
          <TrainingMatrixContent />
        </div>
      </main>
    </div>
  );
};

export default TrainingMatrix;
