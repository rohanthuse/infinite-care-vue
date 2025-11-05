import { useAuth } from '@/contexts/UnifiedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface CarerProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  branch_id: string;
  auth_user_id: string;
}

interface UnifiedCarerAuthReturn {
  user: User | null;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  isCarerRole: boolean;
  carerProfile: CarerProfile | null;
  error: string | null;
  signOut: () => Promise<void>;
}

/**
 * Unified carer authentication hook that uses the main auth context
 * This replaces useCarerAuth and useCarerAuthSafe to prevent conflicts
 */
export const useUnifiedCarerAuth = (): UnifiedCarerAuthReturn => {
  const { user, session, loading: authLoading, error: authError, signOut: baseSignOut } = useAuth();
  const navigate = useNavigate();
  const [isCarerRole, setIsCarerRole] = useState(false);

  console.log('[useUnifiedCarerAuth] Hook initialized', { 
    hasUser: !!user, 
    hasSession: !!session, 
    authLoading 
  });

  // Check for cached profile on mount (optimistic initial state)
  const [carerProfile, setCarerProfile] = useState<CarerProfile | null>(() => {
    try {
      const cached = localStorage.getItem('carerProfile');
      if (cached) {
        console.log('[useUnifiedCarerAuth] Using cached profile');
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('[useUnifiedCarerAuth] Error reading cached profile:', error);
    }
    return null;
  });

  // Use React Query for optimized profile fetching with caching
  const { data: staffData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['staffProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      console.log('[useUnifiedCarerAuth] Fetching staff profile for user:', user.id);

      const { data: staffData, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, email, branch_id, auth_user_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useUnifiedCarerAuth] Profile fetch error:', error);
        throw error;
      }

      if (staffData) {
        console.log('[useUnifiedCarerAuth] Staff profile fetched successfully');
        // Cache in localStorage for fast subsequent loads
        localStorage.setItem('carerProfile', JSON.stringify(staffData));
      }

      return staffData;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 1,
  });

  // Update local state when query data changes
  useEffect(() => {
    if (staffData) {
      console.log('[useUnifiedCarerAuth] Updating carer profile state');
      setCarerProfile(staffData);
      setIsCarerRole(true);
    } else if (!profileLoading && user) {
      console.log('[useUnifiedCarerAuth] No staff profile found');
      setCarerProfile(null);
      setIsCarerRole(false);
    }
  }, [staffData, profileLoading, user]);

  // Enhanced sign out with complete cleanup
  const signOut = async () => {
    try {
      // Clear carer-specific localStorage
      const carerKeys = [
        'carerName', 'carerProfile', 'carerId', 'carerBranch',
        'staffProfile', 'carerAuthToken', 'lastCarerActivity'
      ];
      
      carerKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear state
      setCarerProfile(null);
      setIsCarerRole(false);

      // Use base sign out
      await baseSignOut();

      // Navigate to carer login
      const tenantSlug = window.location.pathname.split('/')[1];
      const loginPath = tenantSlug && tenantSlug !== 'carer-dashboard' 
        ? `/${tenantSlug}/carer-login` 
        : '/carer-login';
      
      navigate(loginPath, { replace: true });
    } catch (error) {
      console.error('[useUnifiedCarerAuth] Sign out error:', error);
      // Force navigation even if sign out fails
      window.location.href = '/carer-login';
    }
  };

  const finalError = authError || (profileError ? String(profileError) : null);

  console.log('[useUnifiedCarerAuth] Final state', { 
    isAuthenticated: !!user && !!session,
    loading: authLoading || profileLoading,
    hasProfile: !!carerProfile,
    isCarerRole,
    error: finalError
  });

  return {
    user,
    session,
    loading: authLoading || profileLoading,
    isAuthenticated: !!user && !!session,
    isCarerRole,
    carerProfile,
    error: finalError,
    signOut
  };
};