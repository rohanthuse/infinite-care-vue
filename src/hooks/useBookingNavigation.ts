
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTenant } from '@/contexts/TenantContext';

export const useBookingNavigation = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

  const navigateToBookings = (options?: {
    branchId?: string;
    branchName?: string;
    date?: Date;
    clientId?: string;
  }) => {
    const { branchId, branchName, date, clientId } = options || {};
    
    if (branchId && branchName) {
      // Navigate to the bookings tab in the branch dashboard using path-based routing
      const basePath = tenantSlug 
        ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`
        : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`;
      
      let targetPath = `${basePath}/bookings`;
      
      // Add query parameters for date and client filtering if needed
      const params = new URLSearchParams();
      if (date) {
        params.set('date', format(date, 'yyyy-MM-dd'));
      }
      if (clientId) {
        params.set('client', clientId);
      }
      
      if (params.toString()) {
        targetPath += `?${params.toString()}`;
      }
      
      navigate(targetPath);
    } else {
      // Generic navigation - might be useful for other contexts
      console.warn('Branch navigation requires branchId and branchName');
    }
  };

  return {
    navigateToBookings,
  };
};
