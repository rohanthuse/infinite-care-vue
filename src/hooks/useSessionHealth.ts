import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionHealth {
  isHealthy: boolean;
  validateBeforeMutation: () => Promise<boolean>;
  markSessionRefreshed: () => void;
  markSessionUnhealthy: () => void;
}

const SESSION_STALE_THRESHOLD = 20 * 60 * 1000; // 20 minutes

export const useSessionHealth = (navigateToLogin: () => void): SessionHealth => {
  const [isHealthy, setIsHealthy] = useState(true);
  const lastRefreshTimeRef = useRef(Date.now());
  
  const validateBeforeMutation = useCallback(async (): Promise<boolean> => {
    const timeSinceRefresh = Date.now() - lastRefreshTimeRef.current;
    
    // If session is too stale, proactively refresh before mutation
    if (timeSinceRefresh > SESSION_STALE_THRESHOLD) {
      console.log('[useSessionHealth] Session stale, refreshing before mutation...');
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('[useSessionHealth] Refresh failed:', error);
          setIsHealthy(false);
          toast.error('Your session has expired. Please log in again.');
          navigateToLogin();
          return false;
        }
        lastRefreshTimeRef.current = Date.now();
        setIsHealthy(true);
        console.log('[useSessionHealth] Session refreshed successfully');
      } catch (err) {
        console.error('[useSessionHealth] Refresh error:', err);
        setIsHealthy(false);
        return false;
      }
    }
    
    // Quick session check
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        console.warn('[useSessionHealth] No active session found');
        setIsHealthy(false);
        toast.error('Session expired. Please log in again.');
        navigateToLogin();
        return false;
      }
      
      setIsHealthy(true);
      return true;
    } catch (err) {
      console.error('[useSessionHealth] Session check error:', err);
      setIsHealthy(false);
      return false;
    }
  }, [navigateToLogin]);
  
  const markSessionRefreshed = useCallback(() => {
    lastRefreshTimeRef.current = Date.now();
    setIsHealthy(true);
  }, []);
  
  const markSessionUnhealthy = useCallback(() => {
    setIsHealthy(false);
  }, []);
  
  return {
    isHealthy,
    validateBeforeMutation,
    markSessionRefreshed,
    markSessionUnhealthy,
  };
};
