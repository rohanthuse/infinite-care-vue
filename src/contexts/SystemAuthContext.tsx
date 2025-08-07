import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
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
        localStorage.setItem('system_session_token', (data as any).session_token);
        setUser((data as any).user);
        return {};
      } else {
        setError((data as any)?.error || 'Authentication failed');
        return { error: (data as any)?.error || 'Authentication failed' };
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