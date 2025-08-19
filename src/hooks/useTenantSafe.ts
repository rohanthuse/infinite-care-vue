import { useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';

// Safe version of useTenant that doesn't throw an error when TenantProvider is not available
export const useTenantSafe = () => {
  const context = useContext(TenantContext);
  
  // If tenant context is not available, return default values
  if (context === undefined) {
    return {
      organization: null,
      tenantSlug: null,
      isLoading: false,
      error: null,
      refreshOrganization: () => {},
    };
  }
  
  return context;
};