import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * PHASE 1: Intercepts navigation from login pages to prevent landing page flash
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
      
      console.log('[LoginNavigationInterceptor] Checking navigation state:', {
        isNavigating,
        targetDashboard,
        pathname: location.pathname
      });
      
      if (isNavigating && targetDashboard) {
        // Validate target path includes tenant slug (basic security check)
        if (targetDashboard.startsWith('/') && targetDashboard.includes('/')) {
          console.log('[LoginNavigationInterceptor] Redirecting to:', targetDashboard);
          
          // Set timeout to clear flags if navigation takes too long
          setTimeout(() => {
            const stillNavigating = sessionStorage.getItem('navigating_to_dashboard') === 'true';
            if (stillNavigating) {
              console.warn('[LoginNavigationInterceptor] Navigation timeout, clearing flags');
              sessionStorage.removeItem('navigating_to_dashboard');
              sessionStorage.removeItem('target_dashboard');
            }
          }, 5000);
          
          navigate(targetDashboard, { replace: true });
        } else {
          console.warn('[LoginNavigationInterceptor] Invalid target path:', targetDashboard);
          sessionStorage.removeItem('navigating_to_dashboard');
          sessionStorage.removeItem('target_dashboard');
        }
      }
    }
  }, [location.pathname, navigate]);
  
  return null;
};
