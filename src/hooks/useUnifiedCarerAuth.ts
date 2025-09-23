import { useAuth } from '@/contexts/UnifiedAuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

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
  const [carerProfile, setCarerProfile] = useState<CarerProfile | null>(null);
  const [isCarerRole, setIsCarerRole] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch carer profile when user is authenticated
  useEffect(() => {
    const fetchCarerProfile = async () => {
      if (!user) {
        setCarerProfile(null);
        setIsCarerRole(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);

      try {
        const { data: staffData, error } = await supabase
          .from('staff')
          .select('id, first_name, last_name, email, branch_id, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[useUnifiedCarerAuth] Profile fetch error:', error);
          setProfileError(error.message);
          setIsCarerRole(false);
          setCarerProfile(null);
        } else if (staffData) {
          setCarerProfile(staffData);
          setIsCarerRole(true);
          setProfileError(null);
        } else {
          setIsCarerRole(false);
          setCarerProfile(null);
        }
      } catch (err: any) {
        console.error('[useUnifiedCarerAuth] Profile fetch exception:', err);
        setProfileError(err.message || 'Failed to fetch carer profile');
        setIsCarerRole(false);
        setCarerProfile(null);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchCarerProfile();
  }, [user]);

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
      setProfileError(null);

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

  return {
    user,
    session,
    loading: authLoading || profileLoading,
    isAuthenticated: !!user && !!session,
    isCarerRole,
    carerProfile,
    error: authError || profileError,
    signOut
  };
};