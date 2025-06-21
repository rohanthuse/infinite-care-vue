
import { Bell, ListChecks, BookText, FileText, ClipboardCheck, AlertTriangle, Clock, Calendar, FileWarning } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useDynamicNotificationData } from "@/hooks/useNotifications";
import { ErrorBoundary } from "@/components/care/ErrorBoundary";

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
  
  // Use props if provided, otherwise fall back to URL params
  const effectiveBranchId = branchId || id;
  const effectiveBranchName = branchName || paramBranchName;
  
  // Get dynamic notification data
  const { data: dynamicData, isLoading } = useDynamicNotificationData(effectiveBranchId);
  
  const handleNavigate = (path: string) => {
    console.log("WorkflowContent navigating to:", path);
    console.log("Effective Branch ID:", effectiveBranchId);
    console.log("Effective Branch Name:", effectiveBranchName);
    
    if (effectiveBranchId && effectiveBranchName) {
      const fullPath = `/admin/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/${path}`;
      console.log("Full path from WorkflowContent:", fullPath);
      navigate(fullPath);
    } else {
      navigate(`/admin/${path}`);
    }
  };

  const handleNotificationsClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      navigate(`/admin/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/notifications`);
    } else {
      navigate(`/admin/notifications`);
    }
  };

  const handleTaskMatrixClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      navigate(`/admin/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/task-matrix`);
    } else {
      navigate(`/admin/task-matrix`);
    }
  };
  
  const handleTrainingMatrixClick = () => {
    if (effectiveBranchId && effectiveBranchName) {
      navigate(`/admin/branch-dashboard/${effectiveBranchId}/${effectiveBranchName}/training-matrix`);
    } else {
      navigate(`/admin/training-matrix`);
    }
  };

  // Create notification cards data
  const notificationCards = [
    {
      title: "Staff Notifications",
      count: isLoading ? 0 : (dynamicData?.staff || 0),
      icon: Bell,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      description: "Overdue bookings and staff alerts",
      onClick: handleNotificationsClick
    },
    {
      title: "System Alerts", 
      count: 3,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Critical system notifications",
      onClick: handleNotificationsClick
    },
    {
      title: "Client Notifications",
      count: isLoading ? 0 : (dynamicData?.client || 0),
      icon: Bell,
      color: "text-green-600", 
      bgColor: "bg-green-100",
      description: "Client requests and appointments",
      onClick: handleNotificationsClick
    },
    {
      title: "Medication Alerts",
      count: isLoading ? 0 : (dynamicData?.medication || 0),
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100", 
      description: "Upcoming medication schedules",
      onClick: handleNotificationsClick
    }
  ];

  // Create workflow element cards data
  const workflowCards = [
    {
      title: "Task Matrix",
      icon: ListChecks,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      description: "Manage priority tasks",
      onClick: handleTaskMatrixClick
    },
    {
      title: "Training Matrix",
      icon: BookText,
      color: "text-green-600", 
      bgColor: "bg-green-100",
      description: "Staff development",
      onClick: handleTrainingMatrixClick
    },
    {
      title: "Form Builder",
      icon: FileText,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
      description: "Document templates",
      onClick: () => handleNavigate('form-builder')
    },
    {
      title: "Key Parameters",
      icon: ListChecks,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100", 
      description: "Track metrics",
      onClick: () => handleNavigate('key-parameters')
    },
    {
      title: "Medication",
      icon: ClipboardCheck,
      color: "text-red-600",
      bgColor: "bg-red-100",
      description: "Medicine tracking", 
      onClick: () => handleNavigate('medication')
    },
    {
      title: "Care Plan",
      icon: ClipboardCheck,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      description: "Patient care plans",
      onClick: () => handleNavigate('care-plan')
    }
  ];

  return (
    <ErrorBoundary fallback={
      <div className="p-4 text-center">
        <p className="text-gray-500">Unable to load workflow content</p>
      </div>
    }>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notifications Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {notificationCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={card.onClick}>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 rounded-full ${card.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`h-8 w-8 ${card.color}`} />
                    </div>
                    <div className={`text-3xl font-bold ${card.color} mb-2`}>{card.count}</div>
                    <h4 className="font-semibold text-gray-800 text-lg">{card.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Workflow Elements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {workflowCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200" onClick={card.onClick}>
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className={`w-16 h-16 rounded-full ${card.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`h-8 w-8 ${card.color}`} />
                    </div>
                    <h4 className="font-semibold text-gray-800 text-lg">{card.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{card.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};

export default WorkflowContent;
