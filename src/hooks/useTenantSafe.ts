import { useContext } from 'react';
import { TenantContext } from '@/contexts/TenantContext';

/**
 * Safe version of useTenant that doesn't throw an error when TenantProvider is not available.
 * Returns default values instead of throwing when the context is undefined.
 */
export const useTenantSafe = () => {
  const context = useContext(TenantContext);
  
  // Return default values if context is not available (no TenantProvider in tree)
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
