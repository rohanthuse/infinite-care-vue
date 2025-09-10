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
    const isOnLoginPage = currentPath === '/login' || currentPath.includes('login');
    
    if (isOnLoginPage && userRoleData?.role) {
      console.log('[NavigationGuard] User authenticated but stuck on login page, redirecting...', {
        role: userRoleData.role,
        branchId: userRoleData.branchId,
        currentPath
      });
      
      // Small delay to prevent navigation conflicts with UnifiedLogin
      setTimeout(() => {
        const role = userRoleData.role;
        
        // Only handle system admin routing - let UnifiedLogin handle all other roles
        if (role === 'app_admin') {
          console.log('[NavigationGuard] Redirecting app_admin to system dashboard');
          navigate('/system-dashboard', { replace: true });
        } else {
          console.log('[NavigationGuard] Non-system admin user - let UnifiedLogin handle tenant-aware routing');
          return; // Let UnifiedLogin handle all tenant-aware routing including super_admin
        }
      }, 1000); // Longer delay to let UnifiedLogin handle navigation first
    }
  }, [user, session, userRoleData, isLoading, navigate]);

  return null; // This component doesn't render anything
};