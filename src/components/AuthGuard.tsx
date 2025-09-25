import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useLocation } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requiresTenant?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  redirectTo = '/login',
  requiresTenant = false 
}) => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || !session) {
    console.log('[AuthGuard] No authenticated user, redirecting to:', redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiresTenant) {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const tenantSlug = pathSegments[0];
    
    if (!tenantSlug || tenantSlug === 'login') {
      console.log('[AuthGuard] No tenant context found, user needs to access via proper tenant URL');
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};