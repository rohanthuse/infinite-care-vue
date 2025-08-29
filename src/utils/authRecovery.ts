import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive auth recovery utilities for stuck login/logout states
 */

/**
 * Enhanced storage clearing with comprehensive cleanup
 */
const clearSupabaseAuthKeys = (): void => {
  console.log('[AuthRecovery] Performing comprehensive storage cleanup');
  
  const localKeys = [];
  const sessionKeys = [];
  
  try {
    // Scan localStorage with enhanced patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth') ||
        key.startsWith('vcrjntfjsmpoupgairep') || // Project-specific keys
        key.includes('session') ||
        key.includes('token')
      )) {
        localKeys.push(key);
      }
    }
    
    // Scan sessionStorage with enhanced patterns
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.startsWith('sb-') || 
        key.includes('supabase') || 
        key.includes('auth') ||
        key.startsWith('vcrjntfjsmpoupgairep') ||
        key.includes('session') ||
        key.includes('token')
      )) {
        sessionKeys.push(key);
      }
    }
    
    console.log('[AuthRecovery] Found auth keys:', { 
      localCount: localKeys.length, 
      sessionCount: sessionKeys.length,
      localKeys: localKeys.slice(0, 5), // Show first 5 for debugging
      sessionKeys: sessionKeys.slice(0, 5)
    });
    
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

/**
 * Clear IndexedDB data used by Supabase
 */
const clearIndexedDBAuth = async (): Promise<void> => {
  try {
    if (!('indexedDB' in window)) {
      console.log('[AuthRecovery] IndexedDB not available');
      return;
    }

    // Clear Supabase-related IndexedDB
    const dbName = `supabase-cache-${window.location.hostname}`;
    
    return new Promise((resolve) => {
      const deleteReq = indexedDB.deleteDatabase(dbName);
      deleteReq.onsuccess = () => {
        console.log('[AuthRecovery] IndexedDB cleared successfully');
        resolve();
      };
      deleteReq.onerror = () => {
        console.warn('[AuthRecovery] Failed to clear IndexedDB');
        resolve(); // Don't fail the whole process
      };
      deleteReq.onblocked = () => {
        console.warn('[AuthRecovery] IndexedDB delete blocked');
        resolve(); // Don't fail the whole process
      };
    });
  } catch (e) {
    console.warn('[AuthRecovery] IndexedDB cleanup error:', e);
  }
};

/**
 * Progressive timeout handler for async operations
 */
export const withProgressiveTimeout = async <T>(
  operation: Promise<T>,
  timeouts: number[] = [5000, 10000, 15000],
  operationName: string = 'operation'
): Promise<T> => {
  let currentTimeoutIndex = 0;
  
  const executeWithTimeout = (timeout: number): Promise<T> => {
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`${operationName} timeout after ${timeout}ms`)), timeout)
      )
    ]);
  };

  while (currentTimeoutIndex < timeouts.length) {
    try {
      console.log(`[AuthRecovery] Attempting ${operationName} with ${timeouts[currentTimeoutIndex]}ms timeout`);
      return await executeWithTimeout(timeouts[currentTimeoutIndex]);
    } catch (error) {
      currentTimeoutIndex++;
      if (currentTimeoutIndex >= timeouts.length) {
        console.error(`[AuthRecovery] ${operationName} failed after all timeout attempts`);
        throw error;
      }
      console.warn(`[AuthRecovery] ${operationName} timeout, retrying with longer timeout`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause between retries
    }
  }
  
  throw new Error(`${operationName} failed after all attempts`);
};

export const clearAllAuthData = async (): Promise<void> => {
  console.log('[AuthRecovery] Starting enhanced auth data cleanup');
  
  try {
    // Sign out from Supabase with timeout protection
    await withProgressiveTimeout(
      supabase.auth.signOut(),
      [3000, 5000],
      'Supabase signOut'
    );
  } catch (e) {
    console.warn('[AuthRecovery] Supabase signOut failed:', e);
  }

  // Clear all Supabase-related keys (enhanced dynamic scan)
  clearSupabaseAuthKeys();

  // Clear known custom auth keys
  const customStorageKeys = [
    'userType', 'clientName', 'clientId', 'branchId',
    'system_session_token', 'systemSessionToken', 'system-session-token',
    'thirdPartySession', 'tenant_context', 'orgSlug', 'userRole'
  ];

  customStorageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn(`[AuthRecovery] Failed to clear key ${key}:`, e);
    }
  });

  // Clear IndexedDB auth data
  await clearIndexedDBAuth();

  console.log('[AuthRecovery] Enhanced auth data cleanup completed');
};

export const nuclearReset = async (): Promise<void> => {
  console.log('[AuthRecovery] Performing ENHANCED nuclear reset - clearing ALL browser data');
  
  try {
    // Multiple Supabase signout attempts
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`[AuthRecovery] Supabase signOut attempt ${i + 1}`);
        await withProgressiveTimeout(
          supabase.auth.signOut({ scope: 'global' }),
          [2000, 4000],
          'Supabase signOut'
        );
        break; // Exit on success
      } catch (e) {
        console.warn(`[AuthRecovery] Supabase signOut attempt ${i + 1} failed:`, e);
        if (i === 2) console.error('[AuthRecovery] All Supabase signOut attempts failed');
      }
    }
  } catch (e) {
    console.warn('[AuthRecovery] Supabase signOut completely failed:', e);
  }

  try {
    // Force clear Supabase client state
    console.log('[AuthRecovery] Force clearing Supabase client state');
    const clientSymbol = Object.getOwnPropertySymbols(supabase).find(s => s.description === 'supabase.client');
    if (clientSymbol) {
      // @ts-ignore - Force reset internal state
      supabase[clientSymbol] = null;
    }
  } catch (e) {
    console.warn('[AuthRecovery] Failed to clear Supabase client state:', e);
  }

  try {
    // Clear ALL browser storage aggressively
    console.log('[AuthRecovery] Clearing ALL browser storage');
    
    // Clear localStorage completely
    if (typeof localStorage !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => localStorage.removeItem(key));
        localStorage.clear();
      } catch (e) {
        console.warn('[AuthRecovery] localStorage clear failed:', e);
      }
    }
    
    // Clear sessionStorage completely
    if (typeof sessionStorage !== 'undefined') {
      try {
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => sessionStorage.removeItem(key));
        sessionStorage.clear();
      } catch (e) {
        console.warn('[AuthRecovery] sessionStorage clear failed:', e);
      }
    }
    
    // Clear IndexedDB aggressively
    await clearIndexedDBAuth();
    
    // Clear ALL service worker caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('[AuthRecovery] ALL service worker caches cleared');
      } catch (e) {
        console.warn('[AuthRecovery] Failed to clear service worker caches:', e);
      }
    }

    // Clear cookies (if possible)
    if (typeof document !== 'undefined') {
      try {
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });
        console.log('[AuthRecovery] Cookies cleared');
      } catch (e) {
        console.warn('[AuthRecovery] Failed to clear cookies:', e);
      }
    }
    
    console.log('[AuthRecovery] ENHANCED nuclear reset completed successfully');
  } catch (e) {
    console.error('[AuthRecovery] Failed to perform complete nuclear reset:', e);
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

/**
 * Session repair and verification utilities
 */
export const repairSession = async (): Promise<{ success: boolean; message: string }> => {
  console.log('[AuthRecovery] Attempting session repair');
  
  try {
    // First, validate current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('[AuthRecovery] Session error detected, clearing corrupted data');
      await clearAllAuthData();
      return { success: true, message: 'Corrupted session cleared' };
    }
    
    if (!session) {
      console.log('[AuthRecovery] No session found, checking for orphaned tokens');
      const orphanedTokens = [];
      
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-')) {
            orphanedTokens.push(key);
          }
        }
      } catch (e) {
        console.warn('[AuthRecovery] Failed to scan for orphaned tokens:', e);
      }
      
      if (orphanedTokens.length > 0) {
        console.log('[AuthRecovery] Found orphaned tokens, clearing them');
        clearSupabaseAuthKeys();
        return { success: true, message: 'Orphaned tokens cleared' };
      }
      
      return { success: true, message: 'No session issues found' };
    }
    
    // Session exists, verify it's working
    try {
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('[AuthRecovery] Session exists but user fetch failed, clearing session');
        await clearAllAuthData();
        return { success: true, message: 'Invalid session cleared' };
      }
    } catch (e) {
      console.log('[AuthRecovery] User verification failed, clearing session');
      await clearAllAuthData();
      return { success: true, message: 'Broken session cleared' };
    }
    
    return { success: true, message: 'Session is healthy' };
  } catch (e) {
    console.error('[AuthRecovery] Session repair failed:', e);
    return { success: false, message: 'Session repair failed' };
  }
};

export const verifyLoginSuccess = async (expectedUserId?: string): Promise<{ verified: boolean; issues: string[] }> => {
  console.log('[AuthRecovery] Verifying login success');
  const issues = [];
  
  try {
    // Check session exists
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      issues.push(`Session error: ${sessionError.message}`);
      return { verified: false, issues };
    }
    
    if (!session) {
      issues.push('No session found after login');
      return { verified: false, issues };
    }
    
    // Check user data
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      issues.push(`User fetch error: ${userError.message}`);
      return { verified: false, issues };
    }
    
    if (!user) {
      issues.push('No user data found after login');
      return { verified: false, issues };
    }
    
    // Verify expected user if provided
    if (expectedUserId && user.user?.id !== expectedUserId) {
      issues.push('User ID mismatch after login');
      return { verified: false, issues };
    }
    
    // Check session expiry
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at <= now) {
        issues.push('Session is already expired');
        return { verified: false, issues };
      }
    }
    
    console.log('[AuthRecovery] Login verification successful');
    return { verified: true, issues: [] };
  } catch (e) {
    console.error('[AuthRecovery] Login verification failed:', e);
    return { verified: false, issues: ['Login verification failed'] };
  }
};

export const validatePreLoginState = async (): Promise<{ canProceed: boolean; issues: string[]; needsRecovery: boolean }> => {
  console.log('[AuthRecovery] Validating pre-login state');
  const issues = [];
  
  try {
    // Check for existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      issues.push(`Session validation error: ${error.message}`);
      return { canProceed: false, issues, needsRecovery: true };
    }
    
    if (session) {
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        issues.push('Expired session found - needs cleanup');
        return { canProceed: false, issues, needsRecovery: true };
      } else {
        issues.push('Valid session already exists');
        return { canProceed: true, issues, needsRecovery: false };
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
      return { canProceed: false, issues, needsRecovery: true };
    }
    
    if (authKeysFound.length > 0) {
      issues.push('Orphaned auth tokens found - needs cleanup');
      return { canProceed: false, issues, needsRecovery: true };
    }
    
    return { canProceed: true, issues: [], needsRecovery: false };
    
  } catch (e) {
    console.error('[AuthRecovery] Pre-login validation failed:', e);
    return { canProceed: false, issues: ['Pre-login validation failed'], needsRecovery: true };
  }
};