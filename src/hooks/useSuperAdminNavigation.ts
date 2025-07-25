import { useNavigate } from 'react-router-dom';

export const useSuperAdminNavigation = () => {
  const navigate = useNavigate();

  const navigateToClients = () => {
    navigate('/clients'); // Navigate to comprehensive clients view across all branches
  };

  const navigateToBookings = () => {
    navigate('/booking-approvals'); // Navigate to booking approvals where you can see bookings across branches
  };

  const navigateToReviews = () => {
    navigate('/reviews'); // Navigate to reviews management across all branches
  };

  const navigateToAccounting = () => {
    navigate('/accounting'); // Navigate to accounting/revenue overview across all branches
  };

  return {
    navigateToClients,
    navigateToBookings,
    navigateToReviews,
    navigateToAccounting
  };
};