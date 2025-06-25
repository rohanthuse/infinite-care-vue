
import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuthSafe = () => {
  const context = useContext(AuthContext);
  
  // If auth context is not available, return default values
  if (context === undefined) {
    return {
      user: null,
      session: null,
      loading: false,
      error: null,
      signOut: async () => {},
    };
  }
  
  return context;
};
