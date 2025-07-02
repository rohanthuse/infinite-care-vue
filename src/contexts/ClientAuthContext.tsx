
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ClientAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  clientProfile: any | null;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
  isClientRole: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within ClientAuthProvider');
  }
  return context;
};

interface ClientAuthProviderProps {
  children: ReactNode;
}

export const ClientAuthProvider = ({ children }: ClientAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientProfile, setClientProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced session validation that tests actual database connectivity
  const validateSessionWithDatabase = async (session: Session | null): Promise<boolean> => {
    if (!session || !session.user) {
      console.log('[ClientAuth] No session or user');
      return false;
    }

    // Check if session is expired
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : new Date(0);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('[ClientAuth] Session token expired:', {
        expiresAt: expiresAt.toISOString(),
        now: now.toISOString()
      });
      return false;
    }

    // Test actual database connectivity with a simple query
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('[ClientAuth] Database connectivity test failed:', error);
        return false;
      }
      
      console.log('[ClientAuth] Session validation successful');
      return true;
    } catch (error) {
      console.error('[ClientAuth] Session validation error:', error);
      return false;
    }
  };

  // Automatic token refresh mechanism
  const scheduleTokenRefresh = (session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    if (!session.expires_at) return;

    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(timeUntilExpiry - 5 * 60 * 1000, 0);

    console.log('[ClientAuth] Scheduling token refresh in:', Math.round(refreshTime / 1000), 'seconds');

    refreshTimeoutRef.current = setTimeout(async () => {
      console.log('[ClientAuth] Attempting automatic token refresh...');
      
      try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('[ClientAuth] Token refresh failed:', error);
          toast.error('Session expired. Please log in again.');
          await signOut();
          return;
        }

        if (data.session) {
          console.log('[ClientAuth] Token refreshed successfully');
          setSession(data.session);
          setUser(data.session.user);
          scheduleTokenRefresh(data.session);
        }
      } catch (error) {
        console.error('[ClientAuth] Token refresh error:', error);
        toast.error('Session expired. Please log in again.');
        await signOut();
      }
    }, refreshTime);
  };

  const validateClientProfile = async (user: User): Promise<any | null> => {
    try {
      const { data: clientRecord, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single();

      if (clientError) {
        console.error('[ClientAuth] Client validation error:', clientError);
        if (clientError.code === 'PGRST116') {
          throw new Error('Access denied: This account is not registered as a client.');
        }
        throw new Error('Unable to verify client account.');
      }

      if (!clientRecord) {
        throw new Error('No client profile found for this account.');
      }

      if (clientRecord.status?.toLowerCase() !== 'active') {
        throw new Error('Your account is not active. Please contact support.');
      }

      console.log('[ClientAuth] Client profile validated:', {
        id: clientRecord.id,
        name: clientRecord.first_name,
        status: clientRecord.status
      });

      return clientRecord;
    } catch (error: any) {
      console.error('[ClientAuth] Profile validation failed:', error);
      throw error;
    }
  };

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('[ClientAuth] Auth state change:', event, session?.user?.id);
    
    setSession(session);
    setUser(session?.user ?? null);
    setError(null);

    if (event === 'SIGNED_IN' && session?.user) {
      try {
        // Validate session with database connectivity test
        const isValidSession = await validateSessionWithDatabase(session);
        
        if (!isValidSession) {
          console.error('[ClientAuth] Session validation failed - attempting refresh');
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error || !data.session) {
            throw new Error('Session expired and refresh failed. Please log in again.');
          }
          
          session = data.session;
          setSession(session);
          setUser(session.user);
        }
        
        const profile = await validateClientProfile(session.user);
        setClientProfile(profile);
        
        // Set localStorage for compatibility
        localStorage.setItem("userType", "client");
        localStorage.setItem("clientName", profile.first_name);
        localStorage.setItem("clientId", profile.id);
        localStorage.setItem("clientEmail", profile.email);
        
        // Schedule automatic token refresh
        scheduleTokenRefresh(session);
        
        toast.success(`Welcome back, ${profile.first_name}!`);
        
        // Only navigate if we're on the login page
        if (window.location.pathname === '/client-login') {
          navigate('/client-dashboard');
        }
      } catch (error: any) {
        console.error('[ClientAuth] Sign in validation failed:', error);
        setError(error.message);
        await supabase.auth.signOut();
        setClientProfile(null);
      }
    }

    if (event === 'SIGNED_OUT') {
      console.log('[ClientAuth] User signed out');
      setClientProfile(null);
      setError(null);
      
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      // Clear localStorage
      localStorage.removeItem("userType");
      localStorage.removeItem("clientName");
      localStorage.removeItem("clientId");
      localStorage.removeItem("clientEmail");
      
      navigate('/client-login');
    }

    if (event === 'TOKEN_REFRESHED' && session) {
      console.log('[ClientAuth] Token refreshed successfully');
      scheduleTokenRefresh(session);
    }

    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Then check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (session?.user) {
            await handleAuthStateChange('SIGNED_IN', session);
          } else {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('[ClientAuth] Initialization error:', error);
        if (mounted) {
          setError('Failed to initialize authentication');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[ClientAuth] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('[ClientAuth] Sign in error:', error);
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

      if (data.user && data.session) {
        console.log('[ClientAuth] Sign in successful:', {
          userId: data.user.id,
          email: data.user.email,
          sessionExpires: data.session.expires_at
        });
        
        return { success: true };
      }

      const errorMsg = 'Authentication completed but no user data received.';
      setError(errorMsg);
      return { success: false, error: errorMsg };

    } catch (error: any) {
      console.error('[ClientAuth] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[ClientAuth] Signing out');
    setLoading(true);
    
    try {
      // Clear refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setClientProfile(null);
      setError(null);
      
      // Clear localStorage
      localStorage.removeItem("userType");
      localStorage.removeItem("clientName");
      localStorage.removeItem("clientId");
      localStorage.removeItem("clientEmail");
      
      toast.success('Signed out successfully');
      navigate('/client-login');
    } catch (error: any) {
      console.error('[ClientAuth] Sign out error:', error);
      setError('Sign out failed. Please try again.');
      toast.error('Sign out failed', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    session,
    loading,
    clientProfile,
    error,
    signIn,
    signOut,
    clearError,
    isAuthenticated: !!user && !!session,
    isClientRole: !!clientProfile,
  };

  return (
    <ClientAuthContext.Provider value={value}>
      {children}
    </ClientAuthContext.Provider>
  );
};
