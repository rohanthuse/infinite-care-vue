
import { useNavigate } from 'react-router-dom';
import { useBranchDashboardNavigation } from './useBranchDashboardNavigation';

export const useMedicationNavigation = () => {
  const navigate = useNavigate();
  const { id: branchId, branchName } = useBranchDashboardNavigation();

  const navigateToCarePlan = (carePlanId: string) => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/care-plan/${carePlanId}`);
    }
  };

  const navigateToClientProfile = (clientId: string) => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/clients/${clientId}`);
    }
  };

  const navigateToBookings = (clientId?: string) => {
    if (branchId && branchName) {
      const baseUrl = `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/bookings`;
      navigate(clientId ? `${baseUrl}?client=${clientId}` : baseUrl);
    }
  };

  const navigateToStaffProfile = (staffId: string) => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/carers/${staffId}`);
    }
  };

  const navigateToReports = () => {
    if (branchId && branchName) {
      navigate(`/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/reports`);
    }
  };

  return {
    navigateToCarePlan,
    navigateToClientProfile,
    navigateToBookings,
    navigateToStaffProfile,
    navigateToReports,
  };
};
