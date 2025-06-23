
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export const useBranchDashboardNavigation = () => {
  const { id, branchName, '*': restPath } = useParams<{ 
    id: string; 
    branchName: string; 
    '*': string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Define valid tab names to distinguish from branch names
  const validTabs = [
    'dashboard', 'key-parameters', 'workflow', 'task-matrix', 'training-matrix',
    'bookings', 'carers', 'clients', 'reviews', 'communication', 'medication',
    'accounting', 'care-plan', 'agreements', 'forms', 'notifications'
  ];

  // Extract the active tab from the current path
  const pathParts = location.pathname.split('/').filter(Boolean);
  let activeTab = 'dashboard'; // Default to dashboard

  // Find the index of the branch name in the path
  const branchNameIndex = pathParts.findIndex(part => 
    decodeURIComponent(part) === decodeURIComponent(branchName || '')
  );

  // If we found the branch name, check what comes after it
  if (branchNameIndex !== -1 && branchNameIndex < pathParts.length - 1) {
    const potentialTab = pathParts[branchNameIndex + 1];
    // Only use it as activeTab if it's a valid tab name
    if (validTabs.includes(potentialTab)) {
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
