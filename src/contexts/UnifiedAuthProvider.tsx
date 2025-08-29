import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const UnifiedAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        console.log('[UnifiedAuth] Initializing authentication...');
        
        // Safety timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted && loading) {
            console.warn('[UnifiedAuth] Initialization timeout, proceeding without auth');
            setLoading(false);
          }
        }, 5000);

        // Get existing session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[UnifiedAuth] Session error:', sessionError);
          setError(sessionError.message);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          clearTimeout(timeoutId);
          
          console.log('[UnifiedAuth] Session initialized:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email
          });
        }
      } catch (err: any) {
        console.error('[UnifiedAuth] Initialization error:', err);
        if (mounted) {
          setError(err.message || 'Authentication initialization failed');
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[UnifiedAuth] Auth state change:', event, session?.user?.email || 'no user');
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
          
          // Only set loading to false after initial session check
          if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            setLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    setError(null);
    setLoading(true);

    try {
      console.log('[UnifiedAuth] Attempting sign in for:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('[UnifiedAuth] Sign in error:', signInError);
        setError(signInError.message);
        return { error: signInError.message };
      }

      if (data.user) {
        console.log('[UnifiedAuth] Sign in successful for:', data.user.email);
        // Session will be updated via onAuthStateChange
        return {};
      }

      return { error: 'Sign in failed' };
    } catch (err: any) {
      console.error('[UnifiedAuth] Sign in exception:', err);
      const errorMessage = err.message || 'Network error occurred';
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('[UnifiedAuth] Signing out...');
      
      // Clear all possible auth-related localStorage
      const authKeys = [
        'supabase.auth.token',
        'sb-vcrjntfjsmpoupgairep-auth-token',
        'userType',
        'clientName',
        'clientId',
        'dev-tenant',
        'system_session_token',
        'systemSessionToken',
        'system-session-token',
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[UnifiedAuth] Sign out error:', error);
        toast.error('Logout failed: ' + error.message);
      } else {
        console.log('[UnifiedAuth] Sign out successful');
        toast.success('Logged out successfully');
      }

      // Force navigation to login
      window.location.replace('/login');
    } catch (err: any) {
      console.error('[UnifiedAuth] Sign out exception:', err);
      toast.error('Logout failed: ' + err.message);
      
      // Even if there's an error, clear state and redirect
      setUser(null);
      setSession(null);
      setError(null);
      window.location.replace('/login');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UnifiedAuthProvider');
  }
  return context;
};