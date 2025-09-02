import { useCallback, useEffect, useRef } from 'react';

interface ActivityTrackerOptions {
  timeoutMs: number; // Timeout in milliseconds
  warningIntervals: number[]; // Warning intervals in milliseconds before timeout
  onTimeout: () => void;
  onWarning: (remainingMs: number) => void;
  onActivity: () => void;
}

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
] as const;

const STORAGE_KEY = 'last_activity_timestamp';

export const useActivityTracker = ({
  timeoutMs,
  warningIntervals,
  onTimeout,
  onWarning,
  onActivity,
}: ActivityTrackerOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    
    warningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    warningTimeoutsRef.current = [];
  }, []);

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(STORAGE_KEY, now.toString());
  }, []);

  const resetTimer = useCallback(() => {
    clearAllTimeouts();
    updateLastActivity();
    onActivity();

    // Set warning timeouts
    warningIntervals.forEach(warningMs => {
      const warningTimeout = setTimeout(() => {
        const remainingMs = timeoutMs - warningMs;
        onWarning(remainingMs);
      }, warningMs);
      warningTimeoutsRef.current.push(warningTimeout);
    });

    // Set main timeout
    timeoutRef.current = setTimeout(() => {
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningIntervals, onTimeout, onWarning, onActivity, updateLastActivity, clearAllTimeouts]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      const otherTabActivity = parseInt(event.newValue);
      if (otherTabActivity > lastActivityRef.current) {
        // Activity detected in another tab, reset our timer
        lastActivityRef.current = otherTabActivity;
        resetTimer();
      }
    }
  }, [resetTimer]);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // Check if we missed activity while tab was hidden
      const storedActivity = localStorage.getItem(STORAGE_KEY);
      if (storedActivity) {
        const lastStoredActivity = parseInt(storedActivity);
        if (lastStoredActivity > lastActivityRef.current) {
          lastActivityRef.current = lastStoredActivity;
          resetTimer();
        }
      }
    }
  }, [resetTimer]);

  useEffect(() => {
    // Initialize with stored activity or current time
    const storedActivity = localStorage.getItem(STORAGE_KEY);
    if (storedActivity) {
      const lastStoredActivity = parseInt(storedActivity);
      const timeSinceLastActivity = Date.now() - lastStoredActivity;
      
      if (timeSinceLastActivity >= timeoutMs) {
        // Already timed out, trigger immediately
        onTimeout();
        return;
      } else {
        // Adjust timer based on time since last activity
        lastActivityRef.current = lastStoredActivity;
        const remainingTime = timeoutMs - timeSinceLastActivity;
        
        // Set warnings that haven't passed yet
        warningIntervals.forEach(warningMs => {
          if (timeSinceLastActivity < warningMs) {
            const warningTimeout = setTimeout(() => {
              const remainingMs = timeoutMs - warningMs;
              onWarning(remainingMs);
            }, warningMs - timeSinceLastActivity);
            warningTimeoutsRef.current.push(warningTimeout);
          }
        });

        // Set main timeout
        timeoutRef.current = setTimeout(() => {
          onTimeout();
        }, remainingTime);
      }
    } else {
      // No stored activity, start fresh
      resetTimer();
    }

    // Add event listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Listen for storage changes (cross-tab activity)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearAllTimeouts();
      
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [timeoutMs, warningIntervals, onTimeout, onWarning, resetTimer, handleActivity, handleStorageChange, handleVisibilityChange, clearAllTimeouts]);

  return {
    resetTimer,
    clearTimer: clearAllTimeouts,
  };
};