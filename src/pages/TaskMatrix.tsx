
import { useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { BranchHeader } from "@/components/BranchHeader";
import TaskMatrixContent from "@/components/workflow/TaskMatrixContent";

const TaskMatrix = () => {
  const { id, branchName } = useParams();
  
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
        
        <div className="mt-6">
          <TaskMatrixContent />
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
