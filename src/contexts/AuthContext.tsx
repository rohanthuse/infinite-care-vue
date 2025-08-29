import React, { useState, useEffect, createContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setError(error.message);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to get session:', err);
        if (mounted) {
          setError('Failed to load authentication');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        setLoading(false);
        
        // Handle explicit sign out event
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setError(null);
          // Navigate to home page on sign out
          setTimeout(() => {
            if (window.location.pathname !== '/') {
              window.location.href = '/';
            }
          }, 100);
        }
      }
    });

    // Then get initial session
    getSession();

    // Set a timeout to ensure we don't stay loading forever
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timed out, proceeding without authentication');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting coordinated logout process');
      
      // Clear auth state immediately
      setUser(null);
      setSession(null);
      setError(null);
      
      // Enhanced storage cleanup - clear ALL possible auth-related keys
      const keysToRemove = [
        'userType', 'clientName', 'clientId', 'branchId',
        'system_session_token', 'systemSessionToken', 'system-session-token',
        'sb-vcrjntfjsmpoupgairep-auth-token',
        'thirdPartySession', 'tenant_context'
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn('Failed to clear storage key:', key, e);
        }
      });

      // Sign out from Supabase with verification
      console.log('[AuthContext] Signing out from Supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        // Continue with logout even if Supabase fails
      }

      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.warn('[AuthContext] Session still exists after signOut, forcing clear');
        // Try again or clear manually
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Failed to force clear storage:', e);
        }
      }

      console.log('[AuthContext] Logout completed successfully');
      
      // Use replace instead of href to avoid potential navigation issues
      window.location.replace('/');
      
    } catch (error) {
      console.error('[AuthContext] SignOut error:', error);
      
      // Force logout even if everything fails
      setUser(null);
      setSession(null);
      setError(null);
      
      // Nuclear option - clear everything
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear storage in error handler:', e);
      }
      
      // Force navigation
      window.location.replace('/');
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
  };

  // Always render children, but show loading state when needed
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};