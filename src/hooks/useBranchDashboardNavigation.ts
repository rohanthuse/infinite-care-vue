
import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

export const useBranchDashboardNavigation = () => {
  const { id, branchName, "*": restPath } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const getTabFromPath = (path?: string): string => {
    if (!path || path.startsWith("dashboard")) return "dashboard";
    if (path.startsWith("key-parameters")) return "key-parameters";
    if (path.startsWith("workflow")) return "workflow";
    if (path.startsWith("task-matrix")) return "task-matrix";
    if (path.startsWith("training-matrix")) return "training-matrix";
    if (path.startsWith("bookings")) return "bookings";
    if (path.startsWith("carers")) return "carers";
    if (path.startsWith("clients")) return "clients";
    if (path.startsWith("communication")) return "communication";
    if (path.startsWith("medication")) return "medication";
    if (path.startsWith("accounting")) return "accounting";
    if (path.startsWith("reviews")) return "reviews";
    if (path.startsWith("care-plan")) return "care-plan";
    if (path.startsWith("agreements")) return "agreements";
    if (path.startsWith("form-builder")) return "forms";
    return "dashboard";
  };

  const [activeTab, setActiveTab] = useState(() => {
    const initialTab = getTabFromPath(restPath);
    console.log(`[BranchDashboard] Initializing. restPath: '${restPath}', initial tab: '${initialTab}'`);
    return initialTab;
  });

  useEffect(() => {
    let path = "";
    const parts = location.pathname.split('/');
    if (parts.length > 4) {
      path = parts.slice(4).join('/');
    }
    const newTab = getTabFromPath(path);
    console.log(`[BranchDashboard] Pathname changed: ${location.pathname}, parsed path: '${path}', new tab: '${newTab}'`);
    setActiveTab(newTab);
  }, [location.pathname]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    if (id && branchName) {
      if (tab === "dashboard") {
        navigate(`/branch-dashboard/${id}/${branchName}`);
      } else if (tab === "key-parameters") {
        navigate(`/branch-dashboard/${id}/${branchName}/key-parameters`);
      } else if (tab === "workflow") {
        navigate(`/branch-dashboard/${id}/${branchName}/workflow`);
      } else if (tab === "task-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/task-matrix`);
      } else if (tab === "training-matrix") {
        navigate(`/branch-dashboard/${id}/${branchName}/training-matrix`);
      } else if (tab === "forms") {
        navigate(`/branch-dashboard/${id}/${branchName}/form-builder`);
      } else if (tab === "care-plan") {
        navigate(`/branch-dashboard/${id}/${branchName}/care-plan`);
      } else if (tab === "communication") {
        navigate(`/branch-dashboard/${id}/${branchName}/communication`);
      } else {
        navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
      }
    }
  };

  const handleWorkflowNavigation = (path: string) => {
    navigate(`/branch-dashboard/${id}/${encodeURIComponent(decodeURIComponent(branchName || ""))}/${path}`);
  };

  return {
    id,
    branchName,
    restPath,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  };
};
