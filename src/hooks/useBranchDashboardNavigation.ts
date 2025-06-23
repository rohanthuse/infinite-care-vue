
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const useBranchDashboardNavigation = () => {
  const { id, branchName, '*': restPath } = useParams<{ 
    id: string; 
    branchName: string; 
    '*': string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Define valid tab names
  const validTabs = [
    'dashboard', 'key-parameters', 'workflow', 'task-matrix', 'training-matrix',
    'bookings', 'carers', 'clients', 'reviews', 'communication', 'medication',
    'accounting', 'care-plan', 'agreements', 'forms', 'notifications'
  ];

  // Extract the active tab from the current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  let activeTab = 'dashboard'; // Default to dashboard

  // Find the branch dashboard pattern and extract the tab
  const branchDashboardIndex = pathParts.findIndex(part => part === 'branch-dashboard');
  
  if (branchDashboardIndex !== -1) {
    // The tab should be at branchDashboardIndex + 3 (after id and branchName)
    const potentialTab = pathParts[branchDashboardIndex + 3];
    
    // Only use it as activeTab if it's a valid tab name
    if (potentialTab && validTabs.includes(potentialTab)) {
      activeTab = potentialTab;
    }
  }

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
