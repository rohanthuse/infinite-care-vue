import { useAuth } from './useAuth';
import { useTenant } from '@/contexts/TenantContext';

/**
 * Hook that combines authentication and tenant context
 * Provides tenant-aware authentication state
 */
export const useTenantAuth = () => {
  const auth = useAuth();
  const tenant = useTenant();

  const isAuthenticated = !!auth.user;
  const isTenantValid = !!tenant.organization;
  const isFullyAuthenticated = isAuthenticated && isTenantValid;

  return {
    // Auth state
    user: auth.user,
    session: auth.session,
    loading: auth.loading,
    error: auth.error,
    signOut: auth.signOut,

    // Tenant state
    organization: tenant.organization,
    tenantSlug: tenant.tenantSlug,
    tenantLoading: tenant.isLoading,
    tenantError: tenant.error,
    refreshOrganization: tenant.refreshOrganization,

    // Combined state
    isAuthenticated,
    isTenantValid,
    isFullyAuthenticated,
    isLoading: auth.loading || tenant.isLoading,
    hasError: !!auth.error || !!tenant.error,
  };
};

/**
 * Hook for getting the current tenant ID
 * Throws error if no tenant is available (should only be used in authenticated contexts)
 */
export const useTenantId = (): string => {
  const { organization } = useTenant();
  
  if (!organization) {
    throw new Error('No tenant organization available. This hook should only be used in tenant-authenticated contexts.');
  }
  
  return organization.id;
};

/**
 * Hook for checking if current user has specific organization role
 */
export const useOrganizationRole = () => {
  const { user } = useAuth();
  const { organization } = useTenant();

  const hasRole = (role: string | string[]): boolean => {
    if (!user || !organization) return false;
    
    // TODO: Implement role checking logic
    // This would need to query organization_members table
    // For now, return true to allow development
    return true;
  };

  const isOwner = () => hasRole('owner');
  const isAdmin = () => hasRole(['owner', 'admin']);
  const isMember = () => hasRole(['owner', 'admin', 'member']);

  return {
    hasRole,
    isOwner,
    isAdmin,
    isMember,
  };
};