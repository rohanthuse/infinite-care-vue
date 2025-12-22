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
  const [isCarerRole, setIsCarerRole] = useState(() => {
    // Optimistically set to true if we have cached profile
    try {
      const cached = localStorage.getItem('carerProfile');
      if (cached) {
        const profile = JSON.parse(cached);
        console.log('[useUnifiedCarerAuth] Initializing isCarerRole from cached profile');
        return !!profile.auth_user_id; // If profile has auth_user_id, it's valid
      }
    } catch (error) {
      console.error('[useUnifiedCarerAuth] Error reading cached profile for role:', error);
    }
    return false;
  });

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
    // Use cached profile as initial data to bridge the gap
    initialData: () => {
      try {
        const cached = localStorage.getItem('carerProfile');
        if (cached) {
          const profile = JSON.parse(cached);
          console.log('[useUnifiedCarerAuth] Using cached profile as initialData for React Query');
          return profile;
        }
      } catch (error) {
        console.error('[useUnifiedCarerAuth] Error loading initialData:', error);
      }
      return undefined;
    },
  });

  // Update local state when query data changes
  useEffect(() => {
    if (staffData) {
      console.log('[useUnifiedCarerAuth] Updating carer profile state from query');
      setCarerProfile(staffData);
      setIsCarerRole(true);
    } else if (!profileLoading && user && !staffData) {
      // Only set to false if query completed with no result
      console.log('[useUnifiedCarerAuth] No staff profile found after query');
      setCarerProfile(null);
      setIsCarerRole(false);
    }
    // Don't set isCarerRole to false if we're still loading or if user is null
  }, [staffData, profileLoading, user]);

  // Enhanced sign out with complete cleanup
  const signOut = async () => {
    console.log('[useUnifiedCarerAuth] Starting carer logout');
    
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

      // Reset theme to light mode on logout
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      console.log('[useUnifiedCarerAuth] Theme reset to light mode on logout');

      // Clear state immediately
      setCarerProfile(null);
      setIsCarerRole(false);

      // Call base sign out (this handles Supabase auth.signOut)
      await baseSignOut();

      // CRITICAL: Redirect to unified login page
      // Use window.location.replace for immediate redirect to prevent race conditions
      console.log('[useUnifiedCarerAuth] Redirecting to unified login page: /login');
      window.location.replace('/login');
      
    } catch (error) {
      console.error('[useUnifiedCarerAuth] Sign out error:', error);
      // Force navigation to unified login even if sign out fails
      window.location.replace('/login');
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