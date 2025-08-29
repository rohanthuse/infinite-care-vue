
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { useTenantSafe } from './useTenantSafe';

export interface CarerAuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  isCarerRole: boolean;
  carerProfile: any | null;
  error: string | null;
}

export function useCarerAuthSafe() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [carerProfile, setCarerProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { tenantSlug } = useTenantSafe();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

  const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('[useCarerAuthSafe] Auth state changed:', event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      setError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // Quick role verification - detailed profile loading handled by useCarerContext
          const { data, error: staffError } = await supabase
            .from('staff')
            .select('id, first_name, auth_user_id, branch_id, organization_id')
            .eq('auth_user_id', session.user.id)
            .maybeSingle();

          if (staffError) {
            console.error('[useCarerAuthSafe] Staff lookup error:', staffError);
            setError('Unable to verify carer account. Please try again or contact support.');
            await supabase.auth.signOut();
            return;
          }

          if (data) {
            console.log('[useCarerAuthSafe] Carer verified:', data.first_name);
            const profile = { 
              ...data, 
              branchId: data.branch_id, 
              organizationId: data.organization_id 
            };
            setCarerProfile(profile);
            
            // Only show welcome message and navigate on actual login from login pages
            const currentPath = window.location.pathname;
            const isFromLoginPage = currentPath === '/carer-login' || currentPath === '/carer-invitation';
            
            // Check if we should show welcome message (only once per session)
            const lastWelcomeTime = localStorage.getItem('carerLastWelcome');
            const sessionStart = session.access_token; // Use token as session identifier
            const currentSessionWelcome = localStorage.getItem('carerCurrentSessionWelcome');
            
            // Show welcome message only if:
            // 1. Coming from login page, OR
            // 2. Haven't shown welcome for this session yet AND it's been more than 30 minutes since last welcome
            const shouldShowWelcome = isFromLoginPage || 
              (currentSessionWelcome !== sessionStart && 
               (!lastWelcomeTime || Date.now() - parseInt(lastWelcomeTime) > 30 * 60 * 1000));
            
            if (shouldShowWelcome) {
              toast.success(`Welcome back, ${data.first_name}!`);
              localStorage.setItem('carerLastWelcome', Date.now().toString());
              localStorage.setItem('carerCurrentSessionWelcome', sessionStart);
            }
            
            // Only navigate if coming from login pages
            if (isFromLoginPage) {
              const dashboardPath = tenantSlug ? `/${tenantSlug}/carer-dashboard` : '/carer-dashboard';
              navigate(dashboardPath);
            }
          } else {
            setError('No carer profile found for this account.');
            await supabase.auth.signOut();
          }
        } catch (err: any) {
          console.error('[useCarerAuthSafe] Profile fetch error:', err);
          setError('Failed to load carer profile. Please try again.');
          await supabase.auth.signOut();
        }
      }

      if (event === 'SIGNED_OUT') {
        console.log('[useCarerAuthSafe] User signed out event received');
        setCarerProfile(null);
        setError(null);
        
        // Clear carer-specific data on auth state change
        const carerKeys = [
          'carerLastWelcome', 'carerCurrentSessionWelcome', 'carerProfile',
          'tenant_context', 'dev-tenant', 'currentTenant'
        ];
        
        carerKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          } catch (e) {
            console.warn('[useCarerAuthSafe] Failed to clear key on signout:', key);
          }
        });
        
        // Only navigate if not already at root
        if (window.location.pathname !== '/') {
          setTimeout(() => {
            window.location.replace('/');
          }, 100);
        }
      }

      setLoading(false);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session with enhanced timeout handling
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('[useCarerAuthSafe] Initial session check:', session?.user?.id);
      
      if (session?.user) {
        // Clear any existing timeout when we have a session
        if (timeoutId) clearTimeout(timeoutId);
        handleAuthStateChange('SIGNED_IN', session);
      } else {
        setLoading(false);
      }
    });

    // Set coordinated timeout that doesn't conflict with AuthContext
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[useCarerAuthSafe] Carer auth timed out after 25 seconds');
        setLoading(false);
        setError('Authentication is taking longer than expected. Please try recovery options.');
      }
    }, 25000); // 25 seconds - longer than AuthContext timeout

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    console.log('[useCarerAuthSafe] Attempting sign in for:', email);
    setLoading(true);
    setError(null);
    
    try {
      // First, let's try to fix any remaining NULL values for this specific user
      console.log('[useCarerAuthSafe] Checking auth health before sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useCarerAuthSafe] Sign in error:', error);
        
        // Handle specific auth errors more gracefully
        let userMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment before trying again.';
        } else if (error.message.includes('converting NULL to string')) {
          userMessage = 'Authentication system issue. Please contact support for assistance.';
        }
        
        setError(userMessage);
        toast.error('Sign in failed', { description: userMessage });
        return { success: false, error: userMessage };
      }

        if (data.user) {
          // Quick verification - detailed profile handled by useCarerContext
          const { data: staffData, error: staffError } = await supabase
            .from('staff')
            .select('id, first_name, branch_id, organization_id')
            .eq('auth_user_id', data.user.id)
            .maybeSingle();

          if (staffError || !staffData) {
            await supabase.auth.signOut();
            const errorMsg = 'Access denied. This account is not registered as a carer.';
            setError(errorMsg);
            toast.error('Access denied', { description: errorMsg });
            return { success: false, error: errorMsg };
          }

          console.log('[useCarerAuthSafe] Carer sign in successful:', staffData.first_name);
          return { success: true, user: data.user, staff: staffData };
        }
    } catch (error: any) {
      console.error('[useCarerAuthSafe] Unexpected sign in error:', error);
      const errorMsg = 'An unexpected error occurred. Please try again.';
      setError(errorMsg);
      toast.error('Sign in failed', { description: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('[useCarerAuthSafe] Starting comprehensive logout');
    setLoading(true);
    
    try {
      // Clear carer-specific localStorage immediately
      console.log('[useCarerAuthSafe] Clearing carer-specific data');
      const carerKeys = [
        'carerLastWelcome', 'carerCurrentSessionWelcome', 'carerProfile',
        'tenant_context', 'dev-tenant', 'currentTenant'
      ];
      
      carerKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn('[useCarerAuthSafe] Failed to clear key:', key);
        }
      });

      // Clear component state immediately
      setCarerProfile(null);
      setError(null);
      setUser(null);
      setSession(null);

      // Sign out from Supabase
      console.log('[useCarerAuthSafe] Signing out from Supabase');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[useCarerAuthSafe] Supabase signOut error:', error);
        // Continue with logout even if Supabase fails
      }

      // Verify session is cleared
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.warn('[useCarerAuthSafe] Session still exists, forcing clear');
        // Nuclear option - clear all storage
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('[useCarerAuthSafe] Failed to clear all storage:', e);
        }
      }

      console.log('[useCarerAuthSafe] Logout completed successfully');
      toast.success('Signed out successfully');
      
      // Navigate to root and replace history to prevent back navigation
      window.location.replace('/');
      
    } catch (error: any) {
      console.error('[useCarerAuthSafe] Sign out error:', error);
      
      // Force logout even if everything fails
      setCarerProfile(null);
      setError(null);
      setUser(null);
      setSession(null);
      
      // Clear all storage as fallback
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn('[useCarerAuthSafe] Failed emergency storage clear:', e);
      }
      
      toast.error('Logout completed with warnings');
      window.location.replace('/');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    isCarerRole: !!carerProfile,
    carerProfile,
    error,
    signIn,
    signOut,
    clearError,
  };
}
