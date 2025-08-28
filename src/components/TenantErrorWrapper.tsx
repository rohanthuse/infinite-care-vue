import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { TenantNotFound } from '@/components/system/TenantNotFound';
import { DevTenantSwitcher } from '@/components/system/DevTenantSwitcher';
import { LoadingScreen } from '@/components/LoadingScreen';

interface TenantErrorWrapperProps {
  children: React.ReactNode;
}

export const TenantErrorWrapper: React.FC<TenantErrorWrapperProps> = ({ children }) => {
  const { tenantSlug, isLoading, error, organization } = useTenant();

  // Show loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If there's a tenant slug but no organization or error, show tenant not found
  if (tenantSlug && (!organization || error)) {
    const errorMessage = error || 'Unknown error';
    console.error('Tenant error:', errorMessage);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 gap-8">
        <TenantNotFound subdomain={tenantSlug} />
        {window.location.hostname === 'localhost' && <DevTenantSwitcher />}
      </div>
    );
  }

  // Normal rendering
  return <>{children}</>;
};