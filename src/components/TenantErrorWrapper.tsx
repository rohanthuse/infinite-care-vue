import React from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { TenantNotFound } from '@/components/system/TenantNotFound';
import { DevSubdomainSwitcher } from '@/components/system/DevSubdomainSwitcher';
import { LoadingScreen } from '@/components/LoadingScreen';

interface TenantErrorWrapperProps {
  children: React.ReactNode;
}

export const TenantErrorWrapper: React.FC<TenantErrorWrapperProps> = ({ children }) => {
  const { subdomain, isLoading, error, organization } = useTenant();

  // Show loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If there's a subdomain but no organization or error, show tenant not found
  if (subdomain && (!organization || error)) {
    const errorMessage = error?.message || 'Unknown error';
    console.error('Tenant error:', errorMessage);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 gap-8">
        <TenantNotFound subdomain={subdomain} />
        {window.location.hostname === 'localhost' && <DevSubdomainSwitcher />}
      </div>
    );
  }

  // Normal rendering
  return <>{children}</>;
};