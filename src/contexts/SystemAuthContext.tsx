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

  // NO automatic session checking on mount - require explicit login
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // SECURITY FIX: Use system authentication directly for admin access
      // This prevents automatic login and requires explicit authentication
      console.log('[SystemAuth] Attempting system authentication for:', email);

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