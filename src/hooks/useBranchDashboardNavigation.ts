
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

export const useBranchDashboardNavigation = () => {
  const { id, branchName } = useParams<{ 
    id: string; 
    branchName: string; 
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useTenant();

  // Define valid tab names - Updated to include all menu items
  const validTabs = [
    'dashboard', 'key-parameters', 'workflow', 'task-matrix', 'training-matrix',
    'bookings', 'carers', 'clients', 'reviews', 'communication', 'medication',
    'accounting', 'finance', 'care-plan', 'agreements', 'forms', 'notifications',
    'events-logs', 'attendance', 'form-builder', 'documents', 'library', 
    'third-party', 'reports'
  ];

  // Extract the active tab from the current path - improved logic for tenant-aware paths
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  // Look for valid tab in the path parts
  // Path structure: [tenant]/branch-dashboard/id/branchName/[tab]
  // or: branch-dashboard/id/branchName/[tab]
  let activeTab = 'dashboard';
  
  // Find the branch-dashboard index to determine the correct position for the tab
  const branchDashboardIndex = pathParts.findIndex(part => part === 'branch-dashboard');
  if (branchDashboardIndex >= 0 && pathParts.length > branchDashboardIndex + 3) {
    // Tab should be at position branchDashboardIndex + 3 (after branch-dashboard/id/branchName)
    const potentialTab = pathParts[branchDashboardIndex + 3];
    if (validTabs.includes(potentialTab)) {
      activeTab = potentialTab;
    }
  }

  const handleTabChange = (tab: string) => {
    if (id && branchName && tenantSlug) {
      const basePath = `/${tenantSlug}/branch-dashboard/${id}/${branchName}`;
      const targetPath = tab === 'dashboard' ? basePath : `${basePath}/${tab}`;
      navigate(targetPath);
    }
  };

  const handleWorkflowNavigation = (section: string) => {
    if (id && branchName && tenantSlug) {
      navigate(`/${tenantSlug}/branch-dashboard/${id}/${branchName}/workflow/${section}`);
    }
  };

  const createTenantAwarePath = (path: string) => {
    if (tenantSlug && id && branchName) {
      return `/${tenantSlug}/branch-dashboard/${id}/${branchName}${path}`;
    }
    return `/branch-dashboard/${id}/${branchName}${path}`;
  };

  return {
    id,
    branchName: branchName ? decodeURIComponent(branchName) : undefined,
    activeTab,
    handleTabChange,
    handleWorkflowNavigation,
    createTenantAwarePath,
    tenantSlug
  };
};
