
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const useBranchDashboardNavigation = () => {
  const { id, branchName } = useParams<{ 
    id: string; 
    branchName: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Define valid tab names
  const validTabs = [
    'dashboard', 'key-parameters', 'workflow', 'task-matrix', 'training-matrix',
    'bookings', 'carers', 'clients', 'reviews', 'communication', 'medication',
    'accounting', 'finance', 'care-plan', 'agreements', 'forms', 'notifications'
  ];

  // Extract the active tab from the current path - simplified logic
  const pathParts = location.pathname.split('/').filter(Boolean);
  const lastPathPart = pathParts[pathParts.length - 1];
  
  // If the last part of the path is a valid tab, use it; otherwise default to dashboard
  const activeTab = validTabs.includes(lastPathPart) ? lastPathPart : 'dashboard';

  const handleTabChange = (tab: string) => {
    if (id && branchName) {
      // Extract tenant slug from current path
      const tenantSlug = location.pathname.split('/')[1];
      const basePath = `/${tenantSlug}/branch-dashboard/${id}/${branchName}`;
      const targetPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`;
      navigate(targetPath);
    }
  };

  const handleWorkflowNavigation = (section: string) => {
    if (id && branchName) {
      // Extract tenant slug from current path
      const tenantSlug = location.pathname.split('/')[1];
      navigate(`/${tenantSlug}/branch-dashboard/${id}/${branchName}/workflow/${section}`);
    }
  };

  return {
    id,
    branchName: branchName ? decodeURIComponent(branchName) : undefined,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation
  };
};
