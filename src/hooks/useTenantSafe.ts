import { useContext } from 'react';

// Import the context type, not the context itself, to avoid circular dependency
// We'll access the actual context at runtime
let TenantContextRef: React.Context<any> | null = null;

/**
 * Safe version of useTenant that doesn't throw an error when TenantProvider is not available.
 * Returns default values instead of throwing when the context is undefined.
 */
export const useTenantSafe = () => {
  // Lazy load the TenantContext to avoid circular dependency issues
  if (TenantContextRef === null) {
    try {
      // Dynamic import at runtime
      const contextModule = require('@/contexts/TenantContext');
      TenantContextRef = contextModule.TenantContext;
    } catch {
      // If import fails, return defaults
      return {
        organization: null,
        tenantSlug: null,
        isLoading: false,
        error: null,
        refreshOrganization: () => {},
      };
    }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const context = useContext(TenantContextRef!);
  
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
