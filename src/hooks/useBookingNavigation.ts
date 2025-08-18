
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

export const useBookingNavigation = () => {
  const navigate = useNavigate();

  const navigateToBookings = (options?: {
    branchId?: string;
    branchName?: string;
    date?: Date;
    clientId?: string;
  }) => {
    const { branchId, branchName, date, clientId } = options || {};
    
    if (branchId && branchName) {
      // Navigate to the bookings tab in the branch dashboard
      const basePath = `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}`;
      const params = new URLSearchParams();
      
      // Add tab parameter to show bookings tab
      params.set('tab', 'bookings');
      
      if (date) {
        params.set('date', format(date, 'yyyy-MM-dd'));
      }
      
      if (clientId) {
        params.set('client', clientId);
      }
      
      const fullPath = `${basePath}?${params.toString()}`;
      navigate(fullPath);
    } else {
      // Generic navigation - might be useful for other contexts
      console.warn('Branch navigation requires branchId and branchName');
    }
  };

  return {
    navigateToBookings,
  };
};
