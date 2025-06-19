
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';

export interface CarerAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCarerRole: boolean;
}

export function useCarerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useCarerAuth] Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user is a carer by looking at staff table
          const { data: staffRecord } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', session.user.id)
            .single();

          if (staffRecord) {
            console.log('[useCarerAuth] Carer authenticated:', staffRecord);
            toast.success(`Welcome back, ${staffRecord.first_name}!`);
          }
        }

        if (event === 'SIGNED_OUT') {
          console.log('[useCarerAuth] User signed out');
          navigate('/carer-login');
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[useCarerAuth] Initial session check:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[useCarerAuth] Attempting sign in for:', email);
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verify this user is a carer
        const { data: staffRecord, error: staffError } = await supabase
          .from('staff')
          .select('id, first_name, last_name, branch_id')
          .eq('id', data.user.id)
          .single();

        if (staffError || !staffRecord) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This account is not registered as a carer.');
        }

        console.log('[useCarerAuth] Carer sign in successful:', staffRecord);
        return { success: true, user: data.user, staff: staffRecord };
      }
    } catch (error: any) {
      console.error('[useCarerAuth] Sign in error:', error);
      toast.error('Sign in failed', {
        description: error.message || 'Invalid email or password'
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useCarerAuth] Signing out');
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success('Signed out successfully');
      navigate('/carer-login');
    } catch (error: any) {
      console.error('[useCarerAuth] Sign out error:', error);
      toast.error('Sign out failed', {
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCarerRole = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id')
        .eq('id', userId)
        .single();

      return !error && !!data;
    } catch {
      return false;
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isCarerRole: false, // Will be determined by checking staff table
    signIn,
    signOut,
    checkCarerRole,
  };
}
