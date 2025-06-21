
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
  carerProfile: any | null;
}

export function useCarerAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [carerProfile, setCarerProfile] = useState<any | null>(null);
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
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (staffRecord) {
            console.log('[useCarerAuth] Carer authenticated:', staffRecord);
            setCarerProfile(staffRecord);
            toast.success(`Welcome back, ${staffRecord.first_name}!`);
            
            // Check if this is first login and profile needs completion
            if (!staffRecord.first_login_completed) {
              navigate('/carer-onboarding');
            } else {
              navigate('/carer-dashboard');
            }
          }
        }

        if (event === 'SIGNED_OUT') {
          console.log('[useCarerAuth] User signed out');
          setCarerProfile(null);
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
      
      // If session exists, fetch carer profile
      if (session?.user) {
        fetchCarerProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchCarerProfile = async (userId: string) => {
    try {
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (staffRecord) {
        setCarerProfile(staffRecord);
      }
    } catch (error) {
      console.error('Error fetching carer profile:', error);
    }
  };

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
          .select('*')
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
      
      setCarerProfile(null);
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

  const acceptInvitation = async (token: string, newPassword: string) => {
    try {
      // First, find the carer by invitation token
      const { data: invitation } = await supabase
        .from('carer_invitations')
        .select('*, staff(*)')
        .eq('invitation_token', token)
        .is('used_at', null)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (!invitation) {
        throw new Error('Invalid or expired invitation');
      }

      // Create auth account for the carer
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.staff.email,
        password: newPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/carer-dashboard`
        }
      });

      if (authError) throw authError;

      // Update staff record with auth user ID and mark invitation as accepted
      const { error: updateError } = await supabase
        .from('staff')
        .update({
          id: authData.user!.id,
          invitation_accepted_at: new Date().toISOString(),
          first_login_completed: false
        })
        .eq('id', invitation.staff_id);

      if (updateError) throw updateError;

      // Mark invitation as used
      await supabase
        .from('carer_invitations')
        .update({ used_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return { success: true };
    } catch (error: any) {
      console.error('[useCarerAuth] Accept invitation error:', error);
      return { success: false, error: error.message };
    }
  };

  const completeProfile = async (profileData: any) => {
    if (!user || !carerProfile) return { success: false, error: 'No authenticated user' };

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          ...profileData,
          first_login_completed: true,
          profile_completed: true
        })
        .eq('id', user.id);

      if (error) throw error;

      setCarerProfile(prev => ({ ...prev, ...profileData, first_login_completed: true }));
      return { success: true };
    } catch (error: any) {
      console.error('[useCarerAuth] Complete profile error:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isCarerRole: !!carerProfile,
    carerProfile,
    signIn,
    signOut,
    acceptInvitation,
    completeProfile,
  };
}
