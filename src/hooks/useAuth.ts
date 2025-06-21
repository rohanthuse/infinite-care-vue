
import { useAuthSafe } from './useAuthSafe';

// This hook provides the same interface as useAuthSafe but with the naming expected by AdminRoutes
export const useAuth = () => {
  const { user, session, loading, signOut } = useAuthSafe();
  
  return {
    session,
    user,
    loading,
    signOut
  };
};
