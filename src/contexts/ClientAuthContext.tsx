
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface ClientAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  clientProfile: any | null;
  error: string | null;
}

interface ClientAuthContextType extends ClientAuthState {
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error('useClientAuth must be used within a ClientAuthProvider');
  }
  return context;
}

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
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

      console.log('[ClientAuthProvider] Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Defer profile fetching to avoid blocking auth state change
        setTimeout(async () => {
          try {
            const { data: clientRecord, error: clientError } = await supabase
              .from('clients')
              .select('*')
              .eq('email', session.user.email)
              .single();

            if (clientError) {
              console.error('[ClientAuthProvider] Client lookup error:', clientError);
              
              if (clientError.code === 'PGRST116') {
                setError('Access denied: This account is not registered as a client.');
              } else {
                setError('Unable to verify client account. Please try again.');
              }
              
              await supabase.auth.signOut();
              return;
            }

            if (clientRecord) {
              if (clientRecord.status?.toLowerCase() !== 'active') {
                setError('Your account is not active. Please contact your administrator.');
                await supabase.auth.signOut();
                return;
              }
              
              console.log('[ClientAuthProvider] Client authenticated:', clientRecord);
              setClientProfile(clientRecord);
              
              // Update localStorage
              localStorage.setItem("userType", "client");
              localStorage.setItem("clientName", clientRecord.first_name);
              localStorage.setItem("clientId", clientRecord.id);
              
              toast.success(`Welcome back, ${clientRecord.first_name}!`);
            }
          } catch (err: any) {
            console.error('[ClientAuthProvider] Profile fetch error:', err);
            setError('Failed to load client profile. Please try again.');
            await supabase.auth.signOut();
          }
        }, 0);
      }

      if (event === 'SIGNED_OUT') {
        console.log('[ClientAuthProvider] User signed out');
        setClientProfile(null);
        setError(null);
        
        // Clear localStorage
        localStorage.removeItem("userType");
        localStorage.removeItem("clientName");
        localStorage.removeItem("clientId");
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[ClientAuthProvider] Initial session check:', session?.user?.id);
      
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
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[ClientAuthProvider] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('[ClientAuthProvider] Sign in error:', error);
        
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
        console.log('[ClientAuthProvider] Sign in successful');
        return { success: true };
      }

      setError('Authentication completed but no user data received.');
      return { success: false, error: 'Authentication completed but no user data received.' };

    } catch (error: any) {
      console.error('[ClientAuthProvider] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[ClientAuthProvider] Signing out');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear state
      setClientProfile(null);
      setError(null);
      setUser(null);
      setSession(null);
      
      // Clear localStorage
      localStorage.removeItem("userType");
      localStorage.removeItem("clientName");
      localStorage.removeItem("clientId");
      
      toast.success('Signed out successfully');
      navigate('/client-login');
    } catch (error: any) {
      console.error('[ClientAuthProvider] Sign out error:', error);
      setError('Sign out failed. Please try again.');
      toast.error('Sign out failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value: ClientAuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!clientProfile,
    clientProfile,
    error,
    signIn,
    signOut,
    clearError,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
}
