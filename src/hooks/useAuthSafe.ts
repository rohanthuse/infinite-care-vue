
import { useAuth } from '@/contexts/UnifiedAuthProvider';

export const useAuthSafe = () => {
  try {
    // Use the unified auth provider - this ensures all components use the same auth source
    return useAuth();
  } catch (error) {
    // If auth context is not available, return default values
    console.warn('[useAuthSafe] Auth context not available, returning defaults');
    return {
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: async () => ({ error: 'Auth not available' }),
      signOut: async () => {},
    };
  }
};
