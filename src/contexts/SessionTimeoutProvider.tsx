import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { useAuth } from '@/contexts/UnifiedAuthProvider';
import { toast } from 'sonner';

interface SessionTimeoutContextType {
  isActive: boolean;
  timeoutDuration: number;
  extendSession: () => void;
}

const SessionTimeoutContext = createContext<SessionTimeoutContextType | undefined>(undefined);

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (context === undefined) {
    throw new Error('useSessionTimeout must be used within a SessionTimeoutProvider');
  }
  return context;
};

interface SessionTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMinutes?: number; // Default: 10 minutes
}

export const SessionTimeoutProvider: React.FC<SessionTimeoutProviderProps> = ({
  children,
  timeoutMinutes = 10,
}) => {
  const { user, signOut } = useAuth();
  const [isActive, setIsActive] = useState(true);
  const [warningToastId, setWarningToastId] = useState<string | number | null>(null);
  
  const timeoutMs = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  
  // Warning intervals: 2 minutes, 1 minute, 30 seconds before timeout
  const warningIntervals = [
    timeoutMs - (2 * 60 * 1000), // 8 minutes (2 min warning)
    timeoutMs - (1 * 60 * 1000), // 9 minutes (1 min warning)
    timeoutMs - (30 * 1000),     // 9.5 minutes (30 sec warning)
  ];

  const handleTimeout = useCallback(async () => {
    console.log('[SessionTimeout] User session timed out due to inactivity');
    setIsActive(false);
    
    // Dismiss any existing warning toast
    if (warningToastId) {
      toast.dismiss(warningToastId);
      setWarningToastId(null);
    }
    
    // Show timeout notification
    toast.error('Session expired due to inactivity', {
      description: 'You have been logged out for security reasons.',
      duration: 5000,
    });
    
    // Clear activity timestamp
    localStorage.removeItem('last_activity_timestamp');
    
    // Sign out user
    await signOut();
  }, [signOut, warningToastId]);

  const handleWarning = useCallback((remainingMs: number) => {
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    
    // Dismiss previous warning toast
    if (warningToastId) {
      toast.dismiss(warningToastId);
    }
    
    let message: string;
    let description: string;
    
    if (remainingMs >= 60 * 1000) {
      // Minutes remaining
      message = `Session expiring in ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
      description = 'Click "Stay Logged In" to continue your session.';
    } else {
      // Seconds remaining
      message = `Session expiring in ${remainingSeconds} seconds`;
      description = 'Click "Stay Logged In" to continue your session.';
    }
    
    const toastId = toast.warning(message, {
      description,
      duration: Infinity, // Keep open until dismissed
      action: {
        label: 'Stay Logged In',
        onClick: () => {
          extendSession();
          toast.dismiss(toastId);
          setWarningToastId(null);
        },
      },
      onDismiss: () => {
        setWarningToastId(null);
      },
    });
    
    setWarningToastId(toastId);
  }, [warningToastId]);

  const handleActivity = useCallback(() => {
    setIsActive(true);
    
    // Dismiss warning toast if activity detected
    if (warningToastId) {
      toast.dismiss(warningToastId);
      setWarningToastId(null);
    }
  }, [warningToastId]);

  const { resetTimer } = useActivityTracker({
    timeoutMs,
    warningIntervals,
    onTimeout: handleTimeout,
    onWarning: handleWarning,
    onActivity: handleActivity,
  });

  const extendSession = useCallback(() => {
    console.log('[SessionTimeout] Session extended by user action');
    resetTimer();
    setIsActive(true);
    
    if (warningToastId) {
      toast.dismiss(warningToastId);
      setWarningToastId(null);
    }
    
    toast.success('Session extended', {
      description: 'Your session has been extended.',
      duration: 3000,
    });
  }, [resetTimer, warningToastId]);

  // Only track activity for authenticated users, but don't interfere with initial auth
  useEffect(() => {
    // Don't interfere with initial authentication or login process
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/' || currentPath.includes('/login') || currentPath === '/dashboard';
    
    if (!user) {
      setIsActive(false);
      if (warningToastId) {
        toast.dismiss(warningToastId);
        setWarningToastId(null);
      }
    } else if (!isAuthPage || currentPath === '/dashboard') {
      // Only start tracking for authenticated users who are past the auth flow
      setIsActive(true);
    }
  }, [user, warningToastId]);

  // Don't render timeout tracking for unauthenticated users or during auth flow
  const currentPath = window.location.pathname;
  const isAuthFlow = currentPath === '/' || currentPath.includes('/login');
  
  if (!user || (isAuthFlow && currentPath !== '/dashboard')) {
    return <>{children}</>;
  }

  const value: SessionTimeoutContextType = {
    isActive,
    timeoutDuration: timeoutMinutes,
    extendSession,
  };

  return (
    <SessionTimeoutContext.Provider value={value}>
      {children}
    </SessionTimeoutContext.Provider>
  );
};