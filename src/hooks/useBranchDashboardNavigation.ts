
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const useBranchDashboardNavigation = () => {
  const { id, branchName, '*': restPath } = useParams<{ 
    id: string; 
    branchName: string; 
    '*': string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract the active tab from the current path
  const pathParts = location.pathname.split('/');
  const activeTab = pathParts[pathParts.length - 1] || 'dashboard';

  const handleTabChange = (tab: string) => {
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/${tab}`);
    }
  };

  const handleWorkflowNavigation = (section: string) => {
    if (id && branchName) {
      navigate(`/branch-dashboard/${id}/${branchName}/workflow/${section}`);
    }
  };

  return {
    id,
    branchName: branchName ? decodeURIComponent(branchName) : undefined,
    restPath,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  };
};
