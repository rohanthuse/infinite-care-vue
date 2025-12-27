import { Bell, ListChecks, FileText, ClipboardCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";

interface WorkflowContentProps {
  branchId?: string;
  branchName?: string;
}

const WorkflowContent = ({
  branchId,
  branchName
}: WorkflowContentProps) => {
  const navigate = useNavigate();
  const { id, branchName: paramBranchName } = useParams();
  const { tenantSlug } = useTenant();
  
  // Use props if provided, otherwise fall back to URL params
  const effectiveBranchId = branchId || id;
  const effectiveBranchName = branchName || paramBranchName;
  
  const handleNavigate = (path: string) => {
    console.log("WorkflowContent navigating to:", path);
    console.log("Effective Branch ID:", effectiveBranchId);
    console.log("Effective Branch Name:", effectiveBranchName);
    console.log("Tenant Slug:", tenantSlug);
    
    if (effectiveBranchId && effectiveBranchName) {
      const fullPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/${path}`
        : `/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/${path}`;
      console.log("Full path from WorkflowContent:", fullPath);
      navigate(fullPath);
    } else {
      navigate(`/${path}`);
    }
  };

  const handleTaskMatrixClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      const targetPath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/task-matrix`
        : `/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/task-matrix`;
      navigate(targetPath);
    } else {
      navigate(`/task-matrix`);
    }
  };
  
  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Workflow Management</h1>
        <p className="text-muted-foreground mt-2 font-medium">Manage and monitor all workflow processes</p>
      </div>
      
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-8 mt-8">
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Core Workflow Elements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-card hover:bg-muted transition-colors cursor-pointer border border-border" onClick={() => handleNavigate('notifications')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">Notification Overview</h3>
                <p className="text-sm text-muted-foreground mt-1">System alerts and updates</p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-muted transition-colors cursor-pointer border border-border" onClick={handleTaskMatrixClick}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                  <ListChecks className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">Action Plan</h3>
                <p className="text-sm text-muted-foreground mt-1">Manage priority tasks</p>
              </CardContent>
            </Card>

            <Card className="bg-card hover:bg-muted transition-colors cursor-pointer border border-border" onClick={() => handleNavigate('forms?source=workflow')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">Form Matrix</h3>
                <p className="text-sm text-muted-foreground mt-1">Document templates</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground tracking-tight mb-4">Additional Workflows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <Card className="bg-card hover:bg-muted transition-colors cursor-pointer border border-border" onClick={() => handleNavigate('care-plan')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3">
                  <ClipboardCheck className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">Care Plan</h3>
                <p className="text-sm text-muted-foreground mt-1">Patient care plans</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default WorkflowContent;
