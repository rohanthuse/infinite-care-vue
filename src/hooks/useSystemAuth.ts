import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for system administration authentication and authorization
 * Checks if the current user is a system administrator with super_admin role
 */
export const useSystemAuth = () => {
  const { user, session, loading: authLoading, error: authError } = useAuth();

  // Check if user has super_admin role
  const { data: isSystemAdmin, isLoading: roleLoading, error: roleError } = useQuery({
    queryKey: ['user-system-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }
      
      return !!data;
    },
    enabled: !!user?.id,
  });

  const isAuthenticated = !!user;
  const isAuthorized = isSystemAdmin === true;
  const isFullyAuthenticated = isAuthenticated && isAuthorized;
  const isLoading = authLoading || roleLoading;
  const hasError = !!authError || !!roleError;

  return {
    // Auth state
    user,
    session,
    
    // Authorization state
    isSystemAdmin: isSystemAdmin === true,
    isAuthenticated,
    isAuthorized,
    isFullyAuthenticated,
    
    // Loading and error states
    isLoading,
    hasError,
    error: authError || roleError,
    
    // Computed states
    displayName: user?.email || 'System Admin',
  };
};

/**
 * Hook for checking specific system permissions
 */
export const useSystemPermissions = () => {
  const { isSystemAdmin, isFullyAuthenticated } = useSystemAuth();

  return {
    canManageOrganizations: isSystemAdmin,
    canManageSubscriptions: isSystemAdmin,
    canViewSystemAnalytics: isSystemAdmin,
    canManageSystemUsers: isSystemAdmin,
    canAccessSystemPortal: isFullyAuthenticated,
  };
};