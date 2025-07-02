
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthResult {
  success: boolean;
  error?: string;
}

export const useClientAuthFallback = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const clearError = () => setError(null);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    setError(null);

    try {
      console.log('[ClientAuth] Attempting sign in for:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (signInError) {
        console.error('[ClientAuth] Sign in error:', signInError);
        
        // Handle specific error cases
        if (signInError.message.includes('Invalid login credentials')) {
          const errorMsg = 'Invalid email or password. Please check your credentials and try again.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        } else if (signInError.message.includes('Email not confirmed')) {
          const errorMsg = 'Please verify your email address before signing in.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        } else {
          setError(signInError.message);
          return { success: false, error: signInError.message };
        }
      }

      if (!data.user) {
        const errorMsg = 'Authentication failed - no user data received.';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log('[ClientAuth] Sign in successful for user:', data.user.id);

      // Verify the user has a client role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'client')
        .single();

      if (roleError || !roleData) {
        console.error('[ClientAuth] Role verification failed:', roleError);
        
        // Try to find client by email for backward compatibility
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id, first_name, last_name, branch_id, status')
          .eq('email', data.user.email)
          .single();

        if (clientError || !clientData) {
          await supabase.auth.signOut();
          const errorMsg = 'Access denied: No client account found for this email.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Check if client is active
        if (clientData.status?.toLowerCase() !== 'active') {
          await supabase.auth.signOut();
          const errorMsg = 'Your account is not active. Please contact support.';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Store client info for compatibility
        localStorage.setItem("clientId", clientData.id);
        localStorage.setItem("clientName", clientData.first_name || 'Client');
        localStorage.setItem("clientEmail", data.user.email || '');
      }

      // Set user type for compatibility
      localStorage.setItem("userType", "client");

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { success: true };

    } catch (error: any) {
      console.error('[ClientAuth] Unexpected error:', error);
      const errorMsg = `Sign in failed: ${error.message || 'Unknown error'}`;
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    signIn,
    loading,
    error,
    clearError
  };
};
