import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

interface SuperAdminGuardProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({ 
  children, 
  fallbackPath = '/login' 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { data: userRoleData, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const isLoading = authLoading || roleLoading;

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log('[SuperAdminGuard] No user found, redirecting to', fallbackPath);
        navigate(fallbackPath, { replace: true });
        return;
      }

      if (!userRoleData || userRoleData.role !== 'super_admin') {
        console.log('[SuperAdminGuard] User is not super admin, redirecting to home');
        navigate('/', { replace: true });
        return;
      }
      
      console.log('[SuperAdminGuard] Super admin authentication check passed for user:', user.email);
    }
  }, [user, userRoleData, isLoading, navigate, fallbackPath]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRoleData || userRoleData.role !== 'super_admin') {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};