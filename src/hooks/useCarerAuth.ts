import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface CarerAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCarerRole: boolean;
  carerProfile: any | null;
}

export function useCarerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [carerProfile, setCarerProfile] = useState<any | null>(null);
  const navigate = useNavigate();

  const fetchCarerProfile = async (userId: string) => {
    try {
      console.log('[useCarerAuth] Fetching carer profile for user:', userId);
      
      // Use the new database function for better performance and consistency
      const { data, error } = await supabase.rpc(
        'get_staff_profile_by_auth_user_id',
        { auth_user_id_param: userId }
      );
      
      if (error) {
        console.error('[useCarerAuth] Error fetching staff record:', error);
        throw error;
      }

      // Return the first record since the function returns an array
      const staffRecord = data && data.length > 0 ? data[0] : null;

      if (staffRecord) {
        console.log('[useCarerAuth] Carer profile loaded:', staffRecord);
        setCarerProfile(staffRecord);
        return staffRecord;
      } else {
        console.warn('[useCarerAuth] No staff record found for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('[useCarerAuth] Error fetching carer profile:', error);
      setCarerProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('[useCarerAuth] Auth state changed:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Fetch carer profile for signed in user
        const profile = await fetchCarerProfile(session.user.id);
        
        if (profile) {
          toast.success(`Welcome back, ${profile.first_name}!`);
          
          // Only navigate on actual sign in, not during normal app usage
          // Check if this is a fresh sign in (not just a page refresh/navigation)
          const currentPath = window.location.pathname;
          if (currentPath === '/carer-login' || currentPath === '/carer-invitation') {
            if (!profile.first_login_completed) {
              navigate('/carer-onboarding');
            } else {
              navigate('/carer-dashboard');
            }
          }
        } else {
          console.error('[useCarerAuth] Could not load carer profile');
          toast.error('Unable to load your profile. Please contact support.');
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useCarerAuth] User signed out');
        setCarerProfile(null);
        navigate('/carer-login');
      }

      // Always set loading to false after handling auth state change
      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useCarerAuth] Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('[useCarerAuth] Initial session check:', session?.user?.id);
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Fetch carer profile for existing session
          await fetchCarerProfile(session.user.id);
        }
      } catch (error) {
        console.error('[useCarerAuth] Error during auth initialization:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[useCarerAuth] Attempting sign in for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verify this user is a carer
        const { data: staffRecord, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('auth_user_id', data.user.id)
          .single();

        if (staffError || !staffRecord) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account is not registered as a carer.');
        }

        console.log('[useCarerAuth] Carer sign in successful:', staffRecord);
        return { success: true, user: data.user, staff: staffRecord };
      }
    } catch (error: any) {
      console.error('[useCarerAuth] Sign in error:', error);
      toast.error('Sign in failed', {
        description: error.message || 'Invalid email or password'
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useCarerAuth] Signing out');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCarerProfile(null);
      toast.success('Signed out successfully');
      navigate('/carer-login');
    } catch (error: any) {
      console.error('[useCarerAuth] Sign out error:', error);
      toast.error('Sign out failed', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string, newPassword: string) => {
    try {
      // First, find the carer by invitation token
      const { data: invitation } = await supabase
        .from('carer_invitations')
        .select('*, staff(*)')
        .eq('invitation_token', token)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Create auth account for the carer
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.staff.email,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/carer-dashboard`
        }
      });

      if (authError) throw authError;

      // Update staff record with auth user ID and mark invitation as accepted
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          auth_user_id: authData.user!.id,
          invitation_accepted_at: new Date().toISOString(),
          first_login_completed: false
        })
        .eq('id', invitation.staff_id);

      if (updateError) throw updateError;

      // Mark invitation as used
      await supabase
        .from('carer_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return { success: true };
    } catch (error: any) {
      console.error('[useCarerAuth] Accept invitation error:', error);
      return { success: false, error: error.message };
    }
  };

  const completeProfile = async (profileData: any) => {
    if (!user || !carerProfile) return { success: false, error: 'No authenticated user' };

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          ...profileData,
          first_login_completed: true,
          profile_completed: true
        })
        .eq('auth_user_id', user.id);

      if (error) throw error;

      setCarerProfile(prev => ({ ...prev, ...profileData, first_login_completed: true }));
      return { success: true };
    } catch (error: any) {
      console.error('[useCarerAuth] Complete profile error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isCarerRole: !!carerProfile,
    carerProfile,
    signIn,
    signOut,
    acceptInvitation,
    completeProfile,
  };
}
