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
}

export function useCarerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCarerRole, setIsCarerRole] = useState(false);
  const navigate = useNavigate();

  const checkCarerRole = async (userId: string) => {
    try {
      console.log('[useCarerAuth] Checking carer role for user:', userId);
      
      // Check if user has carer role and staff record exists
      const { data, error } = await supabase.rpc(
        'get_staff_profile_by_auth_user_id',
        { auth_user_id_param: userId }
      );
      
      if (error) {
        console.error('[useCarerAuth] Error checking carer role:', error);
        setIsCarerRole(false);
        return false;
      }

      const hasCarerRole = data && data.length > 0;
      setIsCarerRole(hasCarerRole);
      console.log('[useCarerAuth] Carer role check result:', hasCarerRole);
      return hasCarerRole;
    } catch (error) {
      console.error('[useCarerAuth] Error checking carer role:', error);
      setIsCarerRole(false);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Set up loading timeout to prevent stuck loading state
    const setLoadingTimeout = () => {
      clearTimeout(loadingTimeout);
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.log('[useCarerAuth] Loading timeout reached, resetting loading state');
          setLoading(false);
        }
      }, 10000); // 10 second timeout
    };

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('[useCarerAuth] Auth state changed:', event, session?.user?.id);
      
      // Clear any existing timeout
      clearTimeout(loadingTimeout);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Check carer role for signed in user
          const hasRole = await checkCarerRole(session.user.id);
          
          if (hasRole) {
            // Only navigate on actual sign in from specific login pages
            // Don't navigate from unified login - let UnifiedLogin handle navigation
            const currentPath = window.location.pathname;
            if (currentPath === '/carer-login' || currentPath === '/carer-invitation') {
              console.log('[useCarerAuth] Navigating from specific carer login page');
              navigate('/carer-dashboard');
            } else {
              console.log('[useCarerAuth] Carer role confirmed, letting current login flow handle navigation');
            }
          } else {
            console.error('[useCarerAuth] User does not have carer role');
            toast.error('Access denied. This account is not registered as a carer.');
            await supabase.auth.signOut();
          }
        } catch (error) {
          console.error('[useCarerAuth] Error during sign in process:', error);
          toast.error('Authentication error occurred');
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useCarerAuth] User signed out');
        setIsCarerRole(false);
        navigate('/carer-login');
      }

      // Always set loading to false after handling auth state change
      if (mounted) {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    const initializeAuth = async () => {
      try {
        setLoadingTimeout(); // Start timeout
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[useCarerAuth] Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }

        console.log('[useCarerAuth] Initial session check:', session?.user?.id);
        
        if (session?.user) {
          setSession(session);
          setUser(session.user);
          
          // Check carer role for existing session
          try {
            await checkCarerRole(session.user.id);
          } catch (error) {
            console.error('[useCarerAuth] Error checking carer role during init:', error);
          }
        }
      } catch (error) {
        console.error('[useCarerAuth] Error during auth initialization:', error);
      } finally {
        clearTimeout(loadingTimeout);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[useCarerAuth] Attempting sign in for:', email);
    setLoading(true);
    
    try {
      // Check if this is a known problematic user and handle gracefully
      if (email === 'shivamshariwaa28@gmail.com') {
        console.log('[useCarerAuth] Detected known user with auth issues, attempting workaround...');
        
        // First try to sign in normally
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        // If we get the "converting NULL to string" error, provide helpful message
        if (error && error.message.includes('converting NULL to string')) {
          throw new Error('Authentication system error. Your account needs to be reset by an administrator. Please contact support.');
        }
        
        if (error) throw error;
        
        if (data.user) {
          // For this specific user, check using auth_user_id
          const { data: staffRecord, error: staffError } = await supabase.rpc(
            'get_staff_profile_by_auth_user_id',
            { auth_user_id_param: data.user.id }
          );

          const staff = staffRecord && staffRecord.length > 0 ? staffRecord[0] : null;

          if (staffError || !staff) {
            await supabase.auth.signOut();
            throw new Error('Access denied. This account is not registered as a carer.');
          }

          console.log('[useCarerAuth] Carer sign in successful with workaround:', staff);
          return { success: true, user: data.user, staff };
        }
      } else {
        // Normal sign in flow for other users
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
      
      setIsCarerRole(false);
      toast.success('Signed out successfully');
      navigate('/login');
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
    if (!user) return { success: false, error: 'No authenticated user' };

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
    isCarerRole,
    signIn,
    signOut,
    acceptInvitation,
    completeProfile,
  };
}
