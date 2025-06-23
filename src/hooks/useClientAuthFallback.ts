
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface ClientAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isClientRole: boolean;
  clientProfile: any | null;
  error: string | null;
}

export function useClientAuthFallback() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('[useClientAuthFallback] Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Check if user is a client by looking at clients table
          const { data: clientRecord, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (clientError) {
            console.error('[useClientAuthFallback] Client lookup error:', clientError);
            
            if (clientError.code === 'PGRST116') {
              setError('Access denied: This account is not registered as a client. Please contact your administrator.');
            } else {
              setError('Unable to verify client account. Please try again or contact support.');
            }
            
            await supabase.auth.signOut();
            return;
          }

          if (clientRecord) {
            console.log('[useClientAuthFallback] Client authenticated successfully:', clientRecord);
            setClientProfile(clientRecord);
            toast.success(`Welcome back, ${clientRecord.first_name}!`);
            
            // Set localStorage data
            localStorage.setItem("userType", "client");
            localStorage.setItem("clientName", clientRecord.first_name);
            localStorage.setItem("clientId", clientRecord.id);
            
            // Only navigate on actual sign in, not during normal app usage
            const currentPath = window.location.pathname;
            if (currentPath === '/client-login') {
              navigate('/client-dashboard');
            }
          } else {
            setError('No client profile found for this account.');
            await supabase.auth.signOut();
          }
        } catch (err: any) {
          console.error('[useClientAuthFallback] Profile fetch error:', err);
          setError('Failed to load client profile. Please try again.');
          await supabase.auth.signOut();
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useClientAuthFallback] User signed out');
        setClientProfile(null);
        setError(null);
        
        // Clear localStorage
        localStorage.removeItem("userType");
        localStorage.removeItem("clientName");
        localStorage.removeItem("clientId");
        
        navigate('/client-login');
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[useClientAuthFallback] Initial session check:', session?.user?.id);
      
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

  const signInWithRetry = async (email: string, password: string) => {
    console.log('[useClientAuthFallback] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      // Attempt normal Supabase auth with enhanced error handling
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('[useClientAuthFallback] Sign in error:', error);
        
        // Handle specific authentication errors with user-friendly messages
        let userMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('Database error') || error.message.includes('email_change')) {
          // This specific error should now be resolved with our schema fix
          userMessage = 'Authentication system has been updated. Please try signing in again.';
          console.log('[useClientAuthFallback] Schema-related error detected (should be resolved):', error.message);
        }
        
        setError(userMessage);
        toast.error('Sign in failed', { description: userMessage });
        return { success: false, error: userMessage };
      }

      if (data.user) {
        console.log('[useClientAuthFallback] Authentication successful for:', email);
        return { success: true, user: data.user };
      }

      // Fallback case
      setError('Authentication completed but no user data received.');
      return { success: false, error: 'Authentication completed but no user data received.' };

    } catch (error: any) {
      console.error('[useClientAuthFallback] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useClientAuthFallback] Signing out');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setClientProfile(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem("userType");
      localStorage.removeItem("clientName");
      localStorage.removeItem("clientId");
      
      toast.success('Signed out successfully');
      navigate('/client-login');
    } catch (error: any) {
      console.error('[useClientAuthFallback] Sign out error:', error);
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
    isClientRole: !!clientProfile,
    clientProfile,
    error,
    signIn: signInWithRetry,
    signOut,
    clearError,
  };
}
