
import { useNavigate } from 'react-router-dom';
import { useBranchDashboardNavigation } from './useBranchDashboardNavigation';

export const useMedicationNavigation = () => {
  const navigate = useNavigate();
  const { id: branchId, branchName, createTenantAwarePath } = useBranchDashboardNavigation();

  const navigateToCarePlan = (carePlanId: string) => {
    if (branchId && branchName) {
      navigate(createTenantAwarePath(`/care-plan/${carePlanId}`));
    }
  };

  const navigateToClientProfile = (clientId: string) => {
    if (branchId && branchName) {
      navigate(createTenantAwarePath(`/clients/${clientId}`));
    }
  };

  const navigateToBookings = (clientId?: string) => {
    if (branchId && branchName) {
      const baseUrl = createTenantAwarePath('/bookings');
      navigate(clientId ? `${baseUrl}?client=${clientId}` : baseUrl);
    }
  };

  const navigateToStaffProfile = (staffId: string) => {
    if (branchId && branchName) {
      navigate(createTenantAwarePath(`/carers/${staffId}`));
    }
  };

  const navigateToReports = () => {
    if (branchId && branchName) {
      navigate(createTenantAwarePath('/reports'));
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
