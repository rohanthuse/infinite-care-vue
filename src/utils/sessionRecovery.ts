import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionRecoveryResult {
  success: boolean;
  message: string;
  actionTaken?: string;
  needsReload?: boolean;
}

/**
 * Advanced session recovery with timeout handling
 */
export const advancedSessionRecovery = async (): Promise<SessionRecoveryResult> => {
  console.log('[SessionRecovery] Starting advanced session recovery...');
  
  try {
    // Step 1: Check current session state
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[SessionRecovery] Session check failed:', sessionError);
      
      // Clear potentially corrupted session data
      try {
        await supabase.auth.signOut();
        localStorage.removeItem('sb-vcrjntfjsmpoupgairep-auth-token');
        sessionStorage.clear();
      } catch (clearError) {
        console.warn('[SessionRecovery] Failed to clear corrupted session:', clearError);
      }
      
      return {
        success: true,
        message: 'Cleared corrupted session data',
        actionTaken: 'session-cleared',
        needsReload: true
      };
    }
    
    // Step 2: If session exists, verify it's valid
    if (session) {
      try {
        // Test the session by making a simple query
        const { error: testError } = await supabase
          .from('staff')
          .select('id')
          .limit(1);
          
        if (testError && testError.message.includes('JWT')) {
          console.log('[SessionRecovery] Invalid JWT detected, refreshing session...');
          
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError || !refreshedSession) {
            console.log('[SessionRecovery] Session refresh failed, signing out...');
            await supabase.auth.signOut();
            
            return {
              success: true,
              message: 'Session expired - please sign in again',
              actionTaken: 'session-expired',
              needsReload: true
            };
          }
          
          return {
            success: true,
            message: 'Session refreshed successfully',
            actionTaken: 'session-refreshed'
          };
        }
        
        return {
          success: true,
          message: 'Session is valid',
          actionTaken: 'session-verified'
        };
      } catch (verifyError) {
        console.error('[SessionRecovery] Session verification failed:', verifyError);
        
        return {
          success: false,
          message: 'Session verification failed - please try signing in again',
          actionTaken: 'verification-failed'
        };
      }
    }
    
    // Step 3: No session found - check for residual auth data
    const authKeys = [
      'sb-vcrjntfjsmpoupgairep-auth-token',
      'supabase.auth.token',
      'system_session_token',
      'userType',
      'clientId'
    ];
    
    let foundResidualData = false;
    authKeys.forEach(key => {
      if (localStorage.getItem(key) || sessionStorage.getItem(key)) {
        foundResidualData = true;
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn('[SessionRecovery] Failed to clear residual key:', key);
        }
      }
    });
    
    if (foundResidualData) {
      return {
        success: true,
        message: 'Cleared residual authentication data',
        actionTaken: 'residual-cleared',
        needsReload: true
      };
    }
    
    return {
      success: true,
      message: 'No session recovery needed',
      actionTaken: 'no-action-needed'
    };
    
  } catch (error: any) {
    console.error('[SessionRecovery] Recovery process failed:', error);
    
    return {
      success: false,
      message: `Recovery failed: ${error.message}`,
      actionTaken: 'recovery-failed'
    };
  }
};

/**
 * Handle login timeout scenarios
 */
export const handleLoginTimeout = async (timeoutStage: number): Promise<SessionRecoveryResult> => {
  console.log(`[SessionRecovery] Handling login timeout at stage ${timeoutStage}`);
  
  const timeoutMessages = {
    1: 'Login is taking longer than expected...',
    2: 'Still processing your login, please wait...',
    3: 'Login timed out - this may indicate a connection issue'
  };
  
  const message = timeoutMessages[timeoutStage as keyof typeof timeoutMessages] || 'Login timeout occurred';
  
  if (timeoutStage >= 3) {
    // Critical timeout - offer recovery options
    toast.error('Login Timeout', {
      description: 'Your login is taking too long. Try recovery options below.',
      duration: 10000
    });
    
    return {
      success: false,
      message: 'Login timed out - recovery options recommended',
      actionTaken: 'timeout-critical'
    };
  } else {
    // Intermediate timeout - just notify
    toast.warning('Login Status', {
      description: message,
      duration: 3000
    });
    
    return {
      success: true,
      message,
      actionTaken: 'timeout-warning'
    };
  }
};

/**
 * Monitor network connectivity for auth operations
 */
export const checkNetworkHealth = async (): Promise<{
  isOnline: boolean;
  latency?: number;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
}> => {
  try {
    const startTime = Date.now();
    
    // Try to reach Supabase
    const response = await fetch('https://vcrjntfjsmpoupgairep.supabase.co/rest/v1/', {
      method: 'HEAD',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NjcxNDAsImV4cCI6MjA2NTU0MzE0MH0.2AACIZItTsFj2-1LGMy0fRcYKvtXd9FtyrRDnkLGsP0'
      }
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      return { isOnline: false, quality: 'offline' };
    }
    
    let quality: 'excellent' | 'good' | 'poor' | 'offline';
    if (latency < 200) quality = 'excellent';
    else if (latency < 500) quality = 'good';
    else quality = 'poor';
    
    return {
      isOnline: true,
      latency,
      quality
    };
  } catch (error) {
    console.warn('[NetworkHealth] Network check failed:', error);
    return { isOnline: false, quality: 'offline' };
  }
};