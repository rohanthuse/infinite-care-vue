
import { useState } from "react";
import { Bell, ListChecks, BookText, FileText, ClipboardCheck, Search, Filter, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Use props if provided, otherwise fall back to URL params
  const effectiveBranchId = branchId || id;
  const effectiveBranchName = branchName || paramBranchName;
  
  const handleNavigate = (path: string) => {
    console.log("WorkflowContent navigating to:", path);
    console.log("Effective Branch ID:", effectiveBranchId);
    console.log("Effective Branch Name:", effectiveBranchName);
    
    if (effectiveBranchId && effectiveBranchName) {
      const fullPath = `/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/${path}`;
      console.log("Full path from WorkflowContent:", fullPath);
      navigate(fullPath);
    } else {
      navigate(`/${path}`);
    }
  };

  const handleTaskMatrixClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      navigate(`/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/task-matrix`);
    } else {
      navigate(`/task-matrix`);
    }
  };
  
  const handleTrainingMatrixClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      navigate(`/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/training-matrix`);
    } else {
      navigate(`/training-matrix`);
    }
  };
  
  return <>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Workflow Management</h1>
        <p className="text-gray-500 mt-2 font-medium">Manage and monitor all workflow processes</p>
      </div>
      
      <motion.div initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.3
    }}>
        <div className="mb-8 mt-8">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Core Workflow Elements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={() => handleNavigate('notifications')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Bell className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Notification Overview</h3>
                <p className="text-sm text-gray-500 mt-1">System alerts and updates</p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={handleTaskMatrixClick}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <ListChecks className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Task Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Manage priority tasks</p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={handleTrainingMatrixClick}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <BookText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Training Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Staff development</p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={() => handleNavigate('forms?source=workflow')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  <FileText className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Form Matrix</h3>
                <p className="text-sm text-gray-500 mt-1">Document templates</p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Additional Workflows</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={() => handleNavigate('key-parameters')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                  <ListChecks className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Key Parameters</h3>
                <p className="text-sm text-gray-500 mt-1">Track metrics</p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={() => handleNavigate('medication')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <ClipboardCheck className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Medication</h3>
                <p className="text-sm text-gray-500 mt-1">Medicine tracking</p>
              </CardContent>
            </Card>

            <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={() => handleNavigate('care-plan')}>
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-cyan-100 flex items-center justify-center mb-3">
                  <ClipboardCheck className="h-8 w-8 text-cyan-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-lg">Care Plan</h3>
                <p className="text-sm text-gray-500 mt-1">Patient care plans</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </>;
};

export default WorkflowContent;
