import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Navigation guard to handle stuck authentication states
 * Ensures users are redirected properly after successful login with tenant-aware paths
 */
export const NavigationGuard = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { data: userRoleData, isLoading } = useUserRole();

  useEffect(() => {
    // Only run if user is authenticated but on login page
    if (!user || !session || isLoading) return;
    
    const currentPath = window.location.pathname;
    // More specific login page detection - avoid false matches like /audi/login
    const isOnLoginPage = currentPath === '/login';
    
    if (isOnLoginPage && userRoleData?.role) {
      console.log('[NavigationGuard] User authenticated but stuck on login page, redirecting...', {
        role: userRoleData.role,
        branchId: userRoleData.branchId,
        currentPath
      });
      
      // Delay to prevent navigation conflicts with UnifiedLogin
      setTimeout(() => {
        const role = userRoleData.role;
        
        // Only handle system admin routing - let UnifiedLogin handle all other roles
        if (role === 'app_admin') {
          console.log('[NavigationGuard] Redirecting app_admin to system dashboard');
          navigate('/system-dashboard', { replace: true });
        } else {
          console.log('[NavigationGuard] Non-system admin user - UnifiedLogin should handle routing');
          // Don't interfere with other roles - UnifiedLogin handles tenant-aware routing
        }
      }, 1500); // Longer delay to ensure UnifiedLogin completes first
    }
  }, [user, session, userRoleData, isLoading, navigate]);

  return null; // This component doesn't render anything
};