import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface SystemAuthContextType {
  user: SystemUser | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const SystemAuthContext = createContext<SystemAuthContextType | undefined>(undefined);

export const SystemAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing Supabase session and listen for auth changes
  useEffect(() => {
    let mounted = true;

    const validateSystemUser = async (session: any) => {
      if (!session?.user || !mounted) {
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        console.log('[SystemAuth] Validating session for:', session.user.email);

        // Verify user has super_admin role
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (roleError) {
          console.error('[SystemAuth] Failed to fetch user roles:', roleError);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        const roles = roleData.map(r => r.role);
        const isSystemAdmin = roles.includes('super_admin') || roles.includes('app_admin');

        if (!isSystemAdmin) {
          console.log('[SystemAuth] User lacks system admin permissions');
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // Set authenticated user state
        const systemUser = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email || '',
          roles: roles
        };

        console.log('[SystemAuth] Session validated for system admin:', systemUser.email);
        if (mounted) {
          setUser(systemUser);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[SystemAuth] Session validation error:', err);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[SystemAuth] Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_OUT' || !session) {
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await validateSystemUser(session);
        }
      }
    );

    // Check for existing session
    const checkExistingSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[SystemAuth] Error getting session:', error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        await validateSystemUser(session);
      } catch (err) {
        console.error('[SystemAuth] Session check error:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      console.log('[SystemAuth] Attempting authentication for:', email);

      // Step 1: Try to sign in to Supabase auth directly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.log('[SystemAuth] Direct auth failed, trying system auth fallback:', authError.message);
        
        // Step 2: Fallback to system authentication method
        const { data: systemData, error: systemError } = await supabase.rpc('system_authenticate', {
          p_email: email,
          p_password: password,
          p_ip_address: null,
          p_user_agent: navigator.userAgent
        });

        if (systemError || !(systemData as any)?.success) {
          const errorMessage = (systemData as any)?.error || 'Authentication failed';
          console.error('[SystemAuth] System auth failed:', errorMessage);
          setError(errorMessage);
          return { error: errorMessage };
        }

        // Step 3: For successful system auth, try to find and sign in the corresponding Supabase user
        const userData = (systemData as any).user;
        console.log('[SystemAuth] System auth successful, attempting Supabase signin for:', userData.email);
        
        // Try to sign in to Supabase using email and a default password or create session
        const { data: retryAuthData, error: retryAuthError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: 'temporary_password' // This might need to be updated based on actual password
        });

        if (retryAuthError) {
          console.log('[SystemAuth] Could not create Supabase session, but system auth succeeded');
          // Store custom session for now
          const sessionToken = (systemData as any).session_token;
          localStorage.setItem('system_session_token', sessionToken);
          setUser(userData);
          return {};
        }

        console.log('[SystemAuth] Full authentication successful');
        setUser(userData);
        return {};
      }

      // Step 4: Direct Supabase auth succeeded, get user roles
      if (authData.user) {
        console.log('[SystemAuth] Direct Supabase auth successful for:', authData.user.email);
        
        // Get user roles from database
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id);

        if (roleError) {
          console.error('[SystemAuth] Failed to fetch user roles:', roleError);
          setError('Failed to verify admin permissions');
          return { error: 'Failed to verify admin permissions' };
        }

        const roles = roleData.map(r => r.role);
        const isSystemAdmin = roles.includes('super_admin') || roles.includes('app_admin');

        if (!isSystemAdmin) {
          console.error('[SystemAuth] User is not a system admin');
          await supabase.auth.signOut();
          setError('Insufficient permissions for system access');
          return { error: 'Insufficient permissions for system access' };
        }

        const user = {
          id: authData.user.id,
          email: authData.user.email || '',
          name: authData.user.email || '',
          roles: roles
        };

        console.log('[SystemAuth] System admin login successful:', user.email);
        setUser(user);
        return {};
      }

      setError('Authentication failed');
      return { error: 'Authentication failed' };
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Network error occurred');
      return { error: 'Network error occurred' };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Supabase auth
      await supabase.auth.signOut();
      
      // Also try system logout if there's a session token
      const sessionToken = localStorage.getItem('system_session_token');
      if (sessionToken) {
        await supabase.rpc('system_logout', {
          p_session_token: sessionToken
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear ALL possible session tokens and storage
      localStorage.removeItem('system_session_token');
      localStorage.removeItem('systemSessionToken');
      localStorage.removeItem('system-session-token');
      sessionStorage.removeItem('system_session_token');
      sessionStorage.removeItem('systemSessionToken');
      sessionStorage.removeItem('system-session-token');
      setUser(null);
      setError(null);
    }
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) || false;
  };

  const value: SystemAuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    hasRole
  };

  return (
    <SystemAuthContext.Provider value={value}>
      {children}
    </SystemAuthContext.Provider>
  );
};

export const useSystemAuth = (): SystemAuthContextType => {
  const context = useContext(SystemAuthContext);
  if (context === undefined) {
    throw new Error('useSystemAuth must be used within a SystemAuthProvider');
  }
  return context;
};