import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive auth recovery utilities for stuck login/logout states
 */

export const clearAllAuthData = async (): Promise<void> => {
  console.log('[AuthRecovery] Starting comprehensive auth data cleanup');
  
  try {
    // Sign out from Supabase first
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[AuthRecovery] Supabase signOut failed:', e);
  }

  // Clear all possible auth-related storage keys
  const storageKeys = [
    'userType', 'clientName', 'clientId', 'branchId',
    'system_session_token', 'systemSessionToken', 'system-session-token',
    'sb-vcrjntfjsmpoupgairep-auth-token',
    'thirdPartySession', 'tenant_context',
    'supabase.auth.token', 'supabase-auth-token'
  ];

  // Clear from both localStorage and sessionStorage
  storageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[AuthRecovery] Failed to clear key ${key}:`, e);
    }
  });

  console.log('[AuthRecovery] Auth data cleanup completed');
};

export const forceLogoutAndRedirect = async (): Promise<void> => {
  console.log('[AuthRecovery] Forcing logout and redirect');
  
  await clearAllAuthData();
  
  // Force redirect to home page
  window.location.replace('/');
};

export const validateSessionState = async (): Promise<{ isValid: boolean; session: any }> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[AuthRecovery] Session validation error:', error);
      return { isValid: false, session: null };
    }
    
    return { isValid: !!session, session };
  } catch (e) {
    console.error('[AuthRecovery] Session validation failed:', e);
    return { isValid: false, session: null };
  }
};

export const attemptSessionRecovery = async (): Promise<boolean> => {
  console.log('[AuthRecovery] Attempting session recovery');
  
  const { isValid, session } = await validateSessionState();
  
  if (!isValid || !session) {
    console.log('[AuthRecovery] No valid session found, clearing data');
    await clearAllAuthData();
    return false;
  }
  
  console.log('[AuthRecovery] Valid session found, recovery successful');
  return true;
};

export const debugAuthState = async (): Promise<void> => {
  console.log('[AuthRecovery] === AUTH STATE DEBUG ===');
  
  // Check Supabase session
  const { data: { session }, error } = await supabase.auth.getSession();
  console.log('[AuthRecovery] Supabase session:', { session: !!session, error, user: session?.user?.email });
  
  // Check localStorage
  const localStorageKeys = [
    'userType', 'clientName', 'clientId', 'branchId',
    'system_session_token', 'systemSessionToken', 'system-session-token'
  ];
  
  const localStorageData = {};
  localStorageKeys.forEach(key => {
    try {
      localStorageData[key] = localStorage.getItem(key);
    } catch (e) {
      localStorageData[key] = 'ERROR';
    }
  });
  
  console.log('[AuthRecovery] localStorage data:', localStorageData);
  console.log('[AuthRecovery] === END DEBUG ===');
};