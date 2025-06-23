
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

export function useClientAuth() {
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

      console.log('[useClientAuth] Auth state changed:', event, session?.user?.id);
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
            console.error('[useClientAuth] Client lookup error:', clientError);
            
            if (clientError.code === 'PGRST116') {
              setError('Access denied: This account is not registered as a client. Please contact your administrator.');
            } else {
              setError('Unable to verify client account. Please try again or contact support.');
            }
            
            await supabase.auth.signOut();
            return;
          }

          if (clientRecord) {
            console.log('[useClientAuth] Client authenticated:', clientRecord);
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
          console.error('[useClientAuth] Profile fetch error:', err);
          setError('Failed to load client profile. Please try again.');
          await supabase.auth.signOut();
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useClientAuth] User signed out');
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
      
      console.log('[useClientAuth] Initial session check:', session?.user?.id);
      
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
    console.log('[useClientAuth] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useClientAuth] Sign in error:', error);
        
        // Provide user-friendly error messages
        let userMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.';
        }
        
        setError(userMessage);
        toast.error('Sign in failed', { description: userMessage });
        return { success: false, error: userMessage };
      }

      if (data.user) {
        // Verify this user is a client (additional check)
        const { data: clientRecord, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('email', data.user.email)
          .single();

        if (clientError || !clientRecord) {
          await supabase.auth.signOut();
          const errorMsg = 'Access denied. This account is not registered as a client.';
          setError(errorMsg);
          toast.error('Access denied', { description: errorMsg });
          return { success: false, error: errorMsg };
        }

        console.log('[useClientAuth] Client sign in successful:', clientRecord);
        return { success: true, user: data.user, client: clientRecord };
      }
    } catch (error: any) {
      console.error('[useClientAuth] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useClientAuth] Signing out');
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
      console.error('[useClientAuth] Sign out error:', error);
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
    signIn,
    signOut,
    clearError,
  };
}
