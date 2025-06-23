
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCarerAuthSafe } from '@/hooks/useCarerAuthSafe';

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
  const { isAuthenticated: carerAuth, loading: carerLoading } = useCarerAuthSafe();
  const clientAuth = localStorage.getItem("userType") === "client";

  // Determine loading state based on user type
  const isLoading = userType === 'admin' ? adminLoading : 
                   userType === 'carer' ? carerLoading : false;

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check authentication based on user type
  const isAuthenticated = userType === 'admin' ? !!adminSession :
                         userType === 'carer' ? carerAuth :
                         userType === 'client' ? clientAuth : false;

  // Redirect if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render children if all checks pass
  return <>{children}</>;
};
