import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';

interface AuthCoordinationState {
  isCoordinating: boolean;
  primaryAuthType: 'none' | 'auth-context' | 'carer-auth' | 'client-auth';
  sessionData: { user: User | null; session: Session | null } | null;
  error: string | null;
}

/**
 * Hook to coordinate between multiple auth contexts and prevent conflicts
 * Ensures only one auth system is active at a time
 */
export const useAuthCoordination = () => {
  const [state, setState] = useState<AuthCoordinationState>({
    isCoordinating: false,
    primaryAuthType: 'none',
    sessionData: null,
    error: null
  });

  useEffect(() => {
    let mounted = true;

    const coordinateAuth = async () => {
      if (!mounted) return;
      
      setState(prev => ({ ...prev, isCoordinating: true }));

      try {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCoordination] Session check error:', error);
          setState(prev => ({ 
            ...prev, 
            error: error.message,
            isCoordinating: false 
          }));
          return;
        }

        if (session?.user) {
          // Determine auth type based on user metadata or database lookup
          try {
            // Check if user is a carer
            const { data: staffData } = await supabase
              .from('staff')
              .select('id')
              .eq('auth_user_id', session.user.id)
              .maybeSingle();

            const primaryAuth = staffData ? 'carer-auth' : 'auth-context';
            
            if (mounted) {
              setState({
                isCoordinating: false,
                primaryAuthType: primaryAuth,
                sessionData: { user: session.user, session },
                error: null
              });
            }
          } catch (dbError) {
            console.error('[AuthCoordination] Database check error:', dbError);
            if (mounted) {
              setState({
                isCoordinating: false,
                primaryAuthType: 'auth-context',
                sessionData: { user: session.user, session },
                error: null
              });
            }
          }
        } else {
          if (mounted) {
            setState({
              isCoordinating: false,
              primaryAuthType: 'none',
              sessionData: null,
              error: null
            });
          }
        }
      } catch (err: any) {
        console.error('[AuthCoordination] Coordination error:', err);
        if (mounted) {
          setState({
            isCoordinating: false,
            primaryAuthType: 'none',
            sessionData: null,
            error: err.message || 'Authentication coordination failed'
          });
        }
      }
    };

    // Initial coordination
    coordinateAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      console.log('[AuthCoordination] Auth state change:', event);
      coordinateAuth();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const clearCoordinationError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return {
    ...state,
    clearCoordinationError
  };
};