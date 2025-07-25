import { useNavigate } from 'react-router-dom';

export const useSuperAdminNavigation = () => {
  const navigate = useNavigate();

  const navigateToClients = () => {
    navigate('/branch'); // Navigate to branch management where you can see all clients across branches
  };

  const navigateToBookings = () => {
    navigate('/booking-approvals'); // Navigate to booking approvals where you can see bookings across branches
  };

  const navigateToReviews = () => {
    navigate('/branch'); // Navigate to branch management where you can access reviews
  };

  const navigateToAccounting = () => {
    navigate('/branch'); // Navigate to branch management where you can access accounting
  };

  return {
    navigateToClients,
    navigateToBookings,
    navigateToReviews,
    navigateToAccounting
  };
};