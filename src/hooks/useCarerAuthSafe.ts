
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
  error: string | null;
}

export function useCarerAuthSafe() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [carerProfile, setCarerProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('[useCarerAuthSafe] Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Use the enhanced database function that handles auth_user_id properly
          const { data, error: staffError } = await supabase.rpc(
            'get_staff_profile_by_auth_user_id',
            { auth_user_id_param: session.user.id }
          );

          if (staffError) {
            console.error('[useCarerAuthSafe] Staff lookup error:', staffError);
            
            if (staffError.code === 'PGRST116') {
              setError('Access denied: This account is not registered as a carer. Please contact your administrator.');
            } else {
              setError('Unable to verify carer account. Please try again or contact support.');
            }
            
            await supabase.auth.signOut();
            return;
          }

          // The function returns an array, get the first record
          const staffRecord = data && data.length > 0 ? data[0] : null;

          if (staffRecord) {
            console.log('[useCarerAuthSafe] Carer authenticated:', staffRecord);
            setCarerProfile(staffRecord);
            toast.success(`Welcome back, ${staffRecord.first_name}!`);
            
            // Only navigate on actual sign in, not during normal app usage
            const currentPath = window.location.pathname;
            if (currentPath === '/carer-login' || currentPath === '/carer-invitation') {
              if (!staffRecord.first_login_completed) {
                navigate('/carer-onboarding');
              } else {
                navigate('/carer-dashboard');
              }
            }
          } else {
            setError('No carer profile found for this account.');
            await supabase.auth.signOut();
          }
        } catch (err: any) {
          console.error('[useCarerAuthSafe] Profile fetch error:', err);
          setError('Failed to load carer profile. Please try again.');
          await supabase.auth.signOut();
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useCarerAuthSafe] User signed out');
        setCarerProfile(null);
        setError(null);
        navigate('/carer-login');
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[useCarerAuthSafe] Initial session check:', session?.user?.id);
      
      if (session?.user) {
        handleAuthStateChange('SIGNED_IN', session);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[useCarerAuthSafe] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      // First, let's try to fix any remaining NULL values for this specific user
      console.log('[useCarerAuthSafe] Checking auth health before sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useCarerAuthSafe] Sign in error:', error);
        
        // Handle specific auth errors more gracefully
        let userMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('converting NULL to string')) {
          userMessage = 'Authentication system issue. Please contact support for assistance.';
        }
        
        setError(userMessage);
        toast.error('Sign in failed', { description: userMessage });
        return { success: false, error: userMessage };
      }

      if (data.user) {
        // Verify this user is a carer using the enhanced function
        const { data: staffData, error: staffError } = await supabase.rpc(
          'get_staff_profile_by_auth_user_id',
          { auth_user_id_param: data.user.id }
        );

        const staffRecord = staffData && staffData.length > 0 ? staffData[0] : null;

        if (staffError || !staffRecord) {
          await supabase.auth.signOut();
          const errorMsg = 'Access denied. This account is not registered as a carer.';
          setError(errorMsg);
          toast.error('Access denied', { description: errorMsg });
          return { success: false, error: errorMsg };
        }

        console.log('[useCarerAuthSafe] Carer sign in successful:', staffRecord);
        return { success: true, user: data.user, staff: staffRecord };
      }
    } catch (error: any) {
      console.error('[useCarerAuthSafe] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useCarerAuthSafe] Signing out');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setCarerProfile(null);
      setError(null);
      toast.success('Signed out successfully');
      navigate('/carer-login');
    } catch (error: any) {
      console.error('[useCarerAuthSafe] Sign out error:', error);
      setError('Sign out failed. Please try again.');
      toast.error('Sign out failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isCarerRole: !!carerProfile,
    carerProfile,
    error,
    signIn,
    signOut,
    clearError,
  };
}
