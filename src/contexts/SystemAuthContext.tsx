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

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      // First try to check if there's a regular Supabase session with super_admin role
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('[SystemAuth] Found Supabase session, checking for super_admin role...');
        
        // Check if user has super_admin role
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'super_admin');

        if (!rolesError && userRoles && userRoles.length > 0) {
          console.log('[SystemAuth] User has super_admin role, setting up system user');
          
          // Create system user object
          const systemUser: SystemUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email || 'System Admin',
            roles: ['super_admin']
          };
          
          setUser(systemUser);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to system session token method
      const sessionToken = localStorage.getItem('system_session_token');
      if (!sessionToken) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('system_validate_session', {
        p_session_token: sessionToken
      });

      if (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem('system_session_token');
        setIsLoading(false);
        return;
      }

      if ((data as any)?.success) {
        setUser((data as any).user);
      } else {
        localStorage.removeItem('system_session_token');
      }
    } catch (err) {
      console.error('Error checking session:', err);
      localStorage.removeItem('system_session_token');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Try regular Supabase auth first
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && authData.user) {
        console.log('[SystemAuth] Supabase auth successful, checking for super_admin role...');
        
        // Check if user has super_admin role
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .eq('role', 'super_admin');

        if (!rolesError && userRoles && userRoles.length > 0) {
          console.log('[SystemAuth] User has super_admin role, login successful');
          
          // Create system user object
          const systemUser: SystemUser = {
            id: authData.user.id,
            email: authData.user.email || '',
            name: authData.user.user_metadata?.full_name || authData.user.email || 'System Admin',
            roles: ['super_admin']
          };
          
          setUser(systemUser);
          return {};
        } else {
          // User doesn't have super_admin role, sign them out
          await supabase.auth.signOut();
          setError('Insufficient permissions for system access');
          return { error: 'Insufficient permissions for system access' };
        }
      }

      // Fallback to system authentication method
      const { data, error } = await supabase.rpc('system_authenticate', {
        p_email: email,
        p_password: password,
        p_ip_address: null, // Could get from browser if needed
        p_user_agent: navigator.userAgent
      });

      if (error) {
        setError('Authentication failed');
        return { error: 'Authentication failed' };
      }

      if ((data as any)?.success) {
        const sessionToken = (data as any).session_token;
        const userData = (data as any).user;
        
        console.log('[SystemAuth] Login successful for user:', userData.email);
        localStorage.setItem('system_session_token', sessionToken);
        setUser(userData);
        return {};
      } else {
        const errorMessage = (data as any)?.error || 'Authentication failed';
        console.error('[SystemAuth] Login failed:', errorMessage);
        setError(errorMessage);
        return { error: errorMessage };
      }
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
      localStorage.removeItem('system_session_token');
      setUser(null);
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