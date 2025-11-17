import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthSafe } from '@/hooks/useAuthSafe';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Navigation guard to handle stuck authentication states
 * Ensures users are redirected properly after successful login with tenant-aware paths
 */
export const NavigationGuard = () => {
  const navigate = useNavigate();
  const { user, session } = useAuthSafe();
  const { data: userRoleData, isLoading } = useUserRole();

  useEffect(() => {
    // DISABLED: NavigationGuard interference removed to prevent login conflicts
    // UnifiedLogin now handles all navigation immediately after authentication
    console.log('[NavigationGuard] Disabled to prevent navigation conflicts with UnifiedLogin');
    return;
    
    // Legacy navigation guard logic (commented out):
    // Only run if user is authenticated but on login page
    // if (!user || !session || isLoading) return;
    // 
    // const currentPath = window.location.pathname;
    // const isOnLoginPage = currentPath === '/login';
    // 
    // if (isOnLoginPage && userRoleData?.role) {
    //   // UnifiedLogin handles all navigation now
    // }
  }, [user, session, userRoleData, isLoading, navigate]);

  return null; // This component doesn't render anything
};