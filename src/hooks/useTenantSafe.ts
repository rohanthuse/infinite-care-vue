// Safe version of useTenant that doesn't throw an error when TenantProvider is not available
export const useTenantSafe = () => {
  try {
    // Try to import and use the real useTenant hook
    const { useTenant } = require('@/contexts/TenantContext');
    return useTenant();
  } catch {
    // If import fails or context is not available, return safe defaults
    return {
      organization: null,
      tenantSlug: null,
      isLoading: false,
      error: null,
      refreshOrganization: () => {},
    };
  }
};