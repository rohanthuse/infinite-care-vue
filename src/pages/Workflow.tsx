
import { useParams } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import NotificationsOverview from "@/components/workflow/NotificationsOverview";
import WorkflowContent from "@/components/workflow/WorkflowContent";

const Workflow = () => {
  const { id, branchName } = useParams();
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      
      <main className="flex-1 container px-4 pt-6 pb-20 md:py-8 mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Workflow Management</h1>
          <p className="text-gray-500 mt-2 font-medium">Manage and monitor all workflow processes</p>
        </div>
        
        <NotificationsOverview branchId={id} branchName={branchName} />
        
        <WorkflowContent branchId={id} branchName={branchName} />
      </main>
    </div>
  );
};

export default Workflow;
