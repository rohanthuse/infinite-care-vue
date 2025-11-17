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
    const currentPath = location.pathname;
    
    // PHASE 3: Aggressive cleanup on ANY navigation
    console.log('[LoginNavigationInterceptor] Checking for stale flags on:', currentPath);
    
    // Check flag age - flags older than 5 seconds are invalid
    const flagTimestamp = sessionStorage.getItem('navigation_flag_timestamp');
    if (flagTimestamp) {
      const age = Date.now() - parseInt(flagTimestamp);
      if (age > 5000) {
        console.warn('[LoginNavigationInterceptor] Clearing stale navigation flags (age:', age, 'ms)');
        sessionStorage.removeItem('navigating_to_dashboard');
        sessionStorage.removeItem('target_dashboard');
        sessionStorage.removeItem('redirect_in_progress');
        sessionStorage.removeItem('navigation_flag_timestamp');
      }
    }
    
    // CRITICAL: Never intercept on /login or any login-related path
    if (currentPath === '/login' || currentPath.includes('/login')) {
      console.log('[LoginNavigationInterceptor] On login page, clearing any stale navigation flags');
      sessionStorage.removeItem('navigating_to_dashboard');
      sessionStorage.removeItem('target_dashboard');
      sessionStorage.removeItem('redirect_in_progress');
      sessionStorage.removeItem('navigation_flag_timestamp');
      return;
    }
    
    // Only intercept on root path
    if (currentPath === '/') {
      const isNavigating = sessionStorage.getItem('navigating_to_dashboard') === 'true';
      const targetDashboard = sessionStorage.getItem('target_dashboard');
      
      console.log('[LoginNavigationInterceptor] Checking navigation state:', {
        isNavigating,
        targetDashboard,
        pathname: currentPath
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
              sessionStorage.removeItem('redirect_in_progress');
            }
          }, 5000);
          
          navigate(targetDashboard, { replace: true });
        } else {
          console.warn('[LoginNavigationInterceptor] Invalid target path:', targetDashboard);
          sessionStorage.removeItem('navigating_to_dashboard');
          sessionStorage.removeItem('target_dashboard');
          sessionStorage.removeItem('redirect_in_progress');
        }
      }
    }
  }, [location.pathname, navigate]);
  
  return null;
};
