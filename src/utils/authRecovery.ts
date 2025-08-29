import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive auth recovery utilities for stuck login/logout states
 */

/**
 * Scan and clear all Supabase auth keys from storage
 */
const clearSupabaseAuthKeys = (): void => {
  console.log('[AuthRecovery] Scanning for Supabase auth keys');
  
  // Scan localStorage for all Supabase keys
  const localKeys = [];
  const sessionKeys = [];
  
  try {
    // Get all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        localKeys.push(key);
      }
    }
    
    // Get all sessionStorage keys  
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase') || key.includes('auth'))) {
        sessionKeys.push(key);
      }
    }
    
    console.log('[AuthRecovery] Found Supabase keys:', { localKeys, sessionKeys });
    
    // Clear all found keys
    localKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`[AuthRecovery] Failed to clear localStorage key ${key}:`, e);
      }
    });
    
    sessionKeys.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`[AuthRecovery] Failed to clear sessionStorage key ${key}:`, e);
      }
    });
    
  } catch (e) {
    console.warn('[AuthRecovery] Error scanning storage keys:', e);
  }
};

export const clearAllAuthData = async (): Promise<void> => {
  console.log('[AuthRecovery] Starting comprehensive auth data cleanup');
  
  try {
    // Sign out from Supabase first
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[AuthRecovery] Supabase signOut failed:', e);
  }

  // Clear all Supabase-related keys (dynamic scan)
  clearSupabaseAuthKeys();

  // Clear known custom auth keys
  const customStorageKeys = [
    'userType', 'clientName', 'clientId', 'branchId',
    'system_session_token', 'systemSessionToken', 'system-session-token',
    'thirdPartySession', 'tenant_context'
  ];

  customStorageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[AuthRecovery] Failed to clear key ${key}:`, e);
    }
  });

  console.log('[AuthRecovery] Auth data cleanup completed');
};

export const nuclearReset = async (): Promise<void> => {
  console.log('[AuthRecovery] Performing nuclear reset - clearing ALL storage');
  
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('[AuthRecovery] Supabase signOut failed during nuclear reset:', e);
  }

  try {
    // Clear ALL localStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('[AuthRecovery] All storage cleared');
  } catch (e) {
    console.error('[AuthRecovery] Failed to clear storage during nuclear reset:', e);
  }
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
  console.log('[AuthRecovery] Supabase session:', { 
    session: !!session, 
    error, 
    user: session?.user?.email,
    expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
  });
  
  // Scan all storage for auth-related keys
  const allLocalKeys = [];
  const allSessionKeys = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allLocalKeys.push(key);
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) allSessionKeys.push(key);
    }
  } catch (e) {
    console.error('[AuthRecovery] Error scanning storage:', e);
  }
  
  console.log('[AuthRecovery] All localStorage keys:', allLocalKeys);
  console.log('[AuthRecovery] All sessionStorage keys:', allSessionKeys);
  
  // Check specific auth keys
  const authKeys = allLocalKeys.concat(allSessionKeys).filter(key => 
    key.startsWith('sb-') || key.includes('supabase') || key.includes('auth') || 
    ['userType', 'clientName', 'clientId', 'branchId', 'system_session_token', 'thirdPartySession'].includes(key)
  );
  
  console.log('[AuthRecovery] Auth-related keys found:', authKeys);
  console.log('[AuthRecovery] === END DEBUG ===');
};

export const validatePreLoginState = async (): Promise<{ canProceed: boolean; issues: string[] }> => {
  console.log('[AuthRecovery] Validating pre-login state');
  const issues = [];
  
  try {
    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      issues.push(`Session validation error: ${error.message}`);
    }
    
    if (session) {
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        issues.push('Expired session found');
      } else {
        issues.push('Valid session already exists');
      }
    }
    
    // Check for corrupted storage
    const authKeysFound = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-')) {
          authKeysFound.push(key);
        }
      }
    } catch (e) {
      issues.push('Unable to scan localStorage');
    }
    
    if (authKeysFound.length > 0 && !session) {
      issues.push('Orphaned auth tokens found without valid session');
    }
    
    return { 
      canProceed: issues.length === 0 || issues.every(issue => issue === 'Valid session already exists'),
      issues 
    };
    
  } catch (e) {
    console.error('[AuthRecovery] Pre-login validation failed:', e);
    return { canProceed: false, issues: ['Pre-login validation failed'] };
  }
};