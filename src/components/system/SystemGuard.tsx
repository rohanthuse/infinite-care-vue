import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSystemAuth } from '@/contexts/SystemAuthContext';

interface SystemGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallbackPath?: string;
}

export const SystemGuard: React.FC<SystemGuardProps> = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = '/system-login' 
}) => {
  const { user, isLoading, hasRole } = useSystemAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        console.log('[SystemGuard] No user found, redirecting to', fallbackPath);
        navigate(fallbackPath, { replace: true });
        return;
      }

      if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
        console.log('[SystemGuard] User lacks required roles, redirecting to dashboard');
        navigate('/system-dashboard', { replace: true });
        return;
      }
      
      console.log('[SystemGuard] Authentication check passed for user:', user.email);
    }
  }, [user, isLoading, requiredRoles, hasRole, navigate, fallbackPath]);

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

  if (!user) {
    return null; // Will redirect via useEffect
  }

  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};