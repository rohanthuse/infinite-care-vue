import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

/**
 * Navigation guard to handle stuck authentication states
 * Ensures users are redirected properly after successful login
 */
export const NavigationGuard = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { data: userRoleData, isLoading } = useUserRole();

  useEffect(() => {
    // Only run if user is authenticated but on login page
    if (!user || !session || isLoading) return;
    
    const currentPath = window.location.pathname;
    const isOnLoginPage = currentPath === '/login' || currentPath.includes('/login');
    
    if (isOnLoginPage && userRoleData?.role) {
      console.log('[NavigationGuard] User authenticated but stuck on login page, redirecting...');
      
      // Small delay to prevent navigation conflicts
      setTimeout(() => {
        const role = userRoleData.role;
        const branchId = userRoleData.branchId;
        
        let targetPath = '/';
        
        if (role === 'app_admin' as any) {
          targetPath = '/system-dashboard';
        } else if (role === 'super_admin' as any) {
          targetPath = '/dashboard'; // fallback for super admin
        } else if (role === 'branch_admin' as any) {
          targetPath = '/dashboard'; // fallback for branch admin
        } else if (role === 'carer' as any) {
          targetPath = '/carer-dashboard';
        } else if (role === 'client' as any) {
          targetPath = '/client-dashboard';
        }
        
        console.log('[NavigationGuard] Redirecting to:', targetPath);
        navigate(targetPath, { replace: true });
      }, 500);
    }
  }, [user, session, userRoleData, isLoading, navigate]);

  return null; // This component doesn't render anything
};