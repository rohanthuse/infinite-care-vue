
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
      // Branch dashboard bookings navigation
      const basePath = `/branch-dashboard/${branchId}/${encodeURIComponent(branchName)}/bookings`;
      const params = new URLSearchParams();
      
      if (date) {
        params.set('date', format(date, 'yyyy-MM-dd'));
      }
      
      if (clientId) {
        params.set('client', clientId);
      }
      
      const fullPath = params.toString() ? `${basePath}?${params.toString()}` : basePath;
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
