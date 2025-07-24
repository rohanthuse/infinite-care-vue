import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCarerAuthSafe } from '@/hooks/useCarerAuthSafe';
import { useUserRole } from '@/hooks/useUserRole';
import { LoadingScreen } from '@/components/LoadingScreen';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  userType?: 'admin' | 'carer' | 'client';
}

export const RouteGuard = ({ 
  children, 
  requireAuth = true, 
  redirectTo = '/',
  userType = 'admin'
}: RouteGuardProps) => {
  const { session: adminSession, loading: adminLoading } = useAuth();
  const { data: currentUser, isLoading: userRoleLoading } = useUserRole();
  
  // Only call carer auth if we actually need it for carer routes
  const carerAuth = userType === 'carer' ? useCarerAuthSafe() : { isAuthenticated: false, loading: false };

  // Determine loading state based on user type
  const isLoading = userType === 'admin' ? adminLoading : 
                   userType === 'carer' ? carerAuth.loading : 
                   userType === 'client' ? userRoleLoading : false;

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Check authentication based on user type using unified auth state
  let isAuthenticated = false;
  
  if (userType === 'admin') {
    isAuthenticated = !!adminSession && (currentUser?.role === 'super_admin' || currentUser?.role === 'branch_admin');
  } else if (userType === 'carer') {
    isAuthenticated = carerAuth.isAuthenticated && currentUser?.role === 'carer';
  } else if (userType === 'client') {
    isAuthenticated = !!currentUser && currentUser.role === 'client';
  }

  // Redirect if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};