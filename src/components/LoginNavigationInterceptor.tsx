import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Intercepts navigation from login pages to prevent landing page flash
 * This component runs before the Index component fully renders
 */
export const LoginNavigationInterceptor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Only intercept on root path
    if (location.pathname === '/') {
      const isNavigating = sessionStorage.getItem('navigating_to_dashboard') === 'true';
      const targetDashboard = sessionStorage.getItem('target_dashboard');
      
      if (isNavigating && targetDashboard) {
        // Immediate redirect without rendering Index
        console.log('[LoginNavigationInterceptor] Redirecting to:', targetDashboard);
        navigate(targetDashboard, { replace: true });
      }
    }
  }, [location.pathname, navigate]);
  
  return null;
};
