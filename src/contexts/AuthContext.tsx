
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import React, { useState, useEffect, createContext, ReactNode } from 'react';

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
    let timeoutId: NodeJS.Timeout | null = null;
    
    console.log('AuthProvider - Setting up authentication...');
    
    const getSession = async () => {
      try {
        console.log('AuthProvider - Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthProvider - Session error:', error);
          if (mounted) {
            setError(error.message);
          }
        } else {
          console.log('AuthProvider - Initial session:', session ? 'Found' : 'None');
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            setError(null);
          }
        }
      } catch (err) {
        console.error('AuthProvider - Failed to get session:', err);
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
    console.log('AuthProvider - Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthProvider - Auth state changed:', event, session ? 'Session exists' : 'No session');
      
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        setLoading(false);
        
        // Clear timeout when we get a successful auth state change
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      }
    });

    // Then get initial session
    getSession();

    // Set a timeout only if we don't have a session after reasonable time
    timeoutId = setTimeout(() => {
      if (mounted && loading && !session) {
        console.warn('AuthProvider - Auth loading timed out');
        setLoading(false);
        setError('Authentication timeout - please try logging in again');
      }
    }, 10000); // 10 second timeout

    return () => {
      console.log('AuthProvider - Cleaning up...');
      mounted = false;
      subscription.unsubscribe();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('AuthProvider - Signing out...');
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthProvider - Sign out error:', error);
        throw error;
      }
      console.log('AuthProvider - Signed out successfully');
    } catch (err) {
      console.error('AuthProvider - Sign out failed:', err);
      throw err;
    }
  };

  const value = {
    user,
    session,
    loading,
    error,
    signOut,
  };

  console.log('AuthProvider - Current state:', { 
    hasUser: !!user, 
    hasSession: !!session, 
    loading, 
    error 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
