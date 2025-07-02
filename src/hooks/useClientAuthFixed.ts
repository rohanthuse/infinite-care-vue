
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

export function useClientAuthFixed() {
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

      console.log('[useClientAuthFixed] Auth state changed:', event, session?.user?.id);
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
            console.error('[useClientAuthFixed] Client lookup error:', clientError);
            
            if (clientError.code === 'PGRST116') {
              setError('Access denied: This account is not registered as a client. Please contact your administrator.');
            } else {
              setError('Unable to verify client account. Please try again or contact support.');
            }
            
            await supabase.auth.signOut();
            return;
          }

          if (clientRecord) {
            console.log('[useClientAuthFixed] Client authenticated:', clientRecord);
            
            // Check if client has active status
            if (clientRecord.status?.toLowerCase() !== 'active') {
              setError('Your account is not active. Please contact your administrator.');
              await supabase.auth.signOut();
              return;
            }

            // Ensure client has proper role assignment
            await ensureClientRole(session.user.id);
            
            setClientProfile(clientRecord);
            toast.success(`Welcome back, ${clientRecord.first_name}!`);
            
            // Set localStorage data
            localStorage.setItem("userType", "client");
            localStorage.setItem("clientName", clientRecord.first_name);
            localStorage.setItem("clientId", clientRecord.id);
            localStorage.setItem("userRole", "client");
            localStorage.setItem("userId", session.user.id);
            
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
          console.error('[useClientAuthFixed] Profile fetch error:', err);
          setError('Failed to load client profile. Please try again.');
          await supabase.auth.signOut();
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useClientAuthFixed] User signed out');
        setClientProfile(null);
        setError(null);
        
        // Clear localStorage
        localStorage.removeItem("userType");
        localStorage.removeItem("clientName");
        localStorage.removeItem("clientId");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userId");
        
        navigate('/client-login');
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[useClientAuthFixed] Initial session check:', session?.user?.id);
      
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

  const ensureClientRole = async (userId: string) => {
    try {
      // Check if user already has client role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'client')
        .single();

      if (!existingRole) {
        console.log('[useClientAuthFixed] Adding client role for user:', userId);
        
        // Add client role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: 'client'
          });

        if (roleError) {
          console.error('[useClientAuthFixed] Error adding client role:', roleError);
        } else {
          console.log('[useClientAuthFixed] Client role added successfully');
        }
      }
    } catch (error) {
      console.error('[useClientAuthFixed] Error ensuring client role:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('[useClientAuthFixed] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useClientAuthFixed] Sign in error:', error);
        
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
        console.log('[useClientAuthFixed] Client sign in successful');
        return { success: true, user: data.user };
      }
    } catch (error: any) {
      console.error('[useClientAuthFixed] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useClientAuthFixed] Signing out');
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
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      
      toast.success('Signed out successfully');
      navigate('/client-login');
    } catch (error: any) {
      console.error('[useClientAuthFixed] Sign out error:', error);
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
