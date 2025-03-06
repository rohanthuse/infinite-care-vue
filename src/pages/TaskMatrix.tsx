
import { useParams, useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { TabNavigation } from "@/components/TabNavigation";
import { BranchHeader } from "@/components/BranchHeader";
import TaskMatrixContent from "@/components/workflow/TaskMatrixContent";
import { Button } from "@/components/ui/button";
import { Download, Plus } from "lucide-react";

const TaskMatrix = () => {
  const { id, branchName } = useParams();
  const navigate = useNavigate();
  
  // Set activeTab to "task-matrix" explicitly
  const activeTab = "task-matrix";

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

  const displayBranchName = branchName ? decodeURIComponent(branchName) : "Med-Infinite Branch";

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
          <div className="flex flex-col space-y-2 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Task Matrix</h1>
                <p className="text-muted-foreground">Track task completion and compliance status</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="gap-1">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </div>
          </div>
          <TaskMatrixContent />
        </div>
      </main>
    </div>
  );
};

export default TaskMatrix;
