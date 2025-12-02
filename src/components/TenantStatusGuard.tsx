import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/hooks/useAuth';
import { checkTenantStatus } from '@/utils/tenantStatusValidation';
import { TenantStatusBlocked } from './TenantStatusBlocked';
import { toast } from 'sonner';

interface TenantStatusGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that enforces tenant subscription status
 * Blocks access if tenant is inactive or suspended
 */
export const TenantStatusGuard: React.FC<TenantStatusGuardProps> = ({ children }) => {
  const { organization, isLoading } = useTenant();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && organization) {
      const statusCheck = checkTenantStatus(organization.subscription_status);
      
      if (!statusCheck.isAllowed) {
        console.log('[TenantStatusGuard] Tenant status not allowed:', {
          status: statusCheck.status,
          message: statusCheck.message
        });
        
        // Show toast notification
        toast.error(statusCheck.message, {
          duration: 5000,
        });
        
        // Sign out the user
        signOut();
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          navigate(`/${organization.slug}/login`, { replace: true });
        }, 500);
      }
    }
  }, [organization, isLoading, signOut, navigate]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If organization status is not active, show blocked page
  if (organization && organization.subscription_status !== 'active') {
    return <TenantStatusBlocked status={organization.subscription_status} organizationName={organization.name} />;
  }

  // All good, render children
  return <>{children}</>;
};
