
import { useAuth as useUnifiedAuth } from '@/contexts/UnifiedAuthProvider';

export const useAuth = () => {
  return useUnifiedAuth();
};

// Enhanced auth debugging hook for client-specific authentication
export const useClientAuthDebug = () => {
  const auth = useAuth();
  
  const debugClientAuth = async () => {
    console.log('[useClientAuthDebug] Current auth state:', {
      user: auth.user?.id,
      email: auth.user?.email,
      session: !!auth.session,
      loading: auth.loading,
      error: auth.error
    });

    // Check localStorage data
    const clientData = {
      userType: localStorage.getItem("userType"),
      clientName: localStorage.getItem("clientName"),
      clientId: localStorage.getItem("clientId")
    };
    
    console.log('[useClientAuthDebug] Client localStorage data:', clientData);
    
    return {
      authState: auth,
      clientData,
      isClientAuthenticated: auth.user && clientData.userType === 'client' && clientData.clientId
    };
  };

  return { debugClientAuth };
};
