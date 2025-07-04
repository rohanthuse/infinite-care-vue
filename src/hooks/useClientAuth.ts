import { useUserRole } from './useUserRole';

/**
 * Hook to get authenticated client information from Supabase auth
 * Replaces localStorage-based client identification
 */
export const useClientAuth = () => {
  const { data: currentUser, isLoading, error } = useUserRole();
  
  const isClient = currentUser?.role === 'client';
  const clientId = currentUser?.clientId;
  const clientName = currentUser?.fullName;
  const branchId = currentUser?.branchId;
  
  // Create clientProfile object for backward compatibility
  const clientProfile = isClient && clientId ? {
    id: clientId,
    name: clientName,
    branchId: branchId
  } : null;
  
  return {
    isAuthenticated: isClient && !!clientId,
    clientId: clientId || null,
    clientName: clientName || null,
    branchId: branchId || null,
    clientProfile,
    user: currentUser,
    isLoading,
    loading: isLoading, // alias for backward compatibility
    error
  };
};

/**
 * Hook to get client ID for authenticated clients
 * Throws error if not authenticated as client
 */
export const useAuthenticatedClientId = (): string => {
  const { clientId, isAuthenticated } = useClientAuth();
  
  if (!isAuthenticated || !clientId) {
    throw new Error('Client not authenticated');
  }
  
  return clientId;
};