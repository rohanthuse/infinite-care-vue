import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { CustomButton } from '@/components/ui/CustomButton';

/**
 * PHASE 5: Recovery UI Component
 * Detects stuck states and offers manual recovery options
 */
export const StuckStateRecovery = () => {
  const [showRecovery, setShowRecovery] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only show on landing page or login page
    const isRelevantPage = location.pathname === '/' || location.pathname === '/login';
    if (!isRelevantPage) return;

    // Show recovery UI after 5 seconds if still on the page
    const timer = setTimeout(() => {
      // Check if we're stuck
      const navigating = sessionStorage.getItem('navigating_to_dashboard') === 'true';
      const hasStuckFlags = navigating || sessionStorage.getItem('redirect_in_progress') === 'true';
      
      if (hasStuckFlags) {
        console.warn('[StuckStateRecovery] Detected stuck state, showing recovery UI');
        setShowRecovery(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const handleClearAndReload = () => {
    console.log('[StuckStateRecovery] Clearing all auth data and reloading');
    
    // Clear all sessionStorage
    sessionStorage.clear();
    
    // Clear Supabase auth from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase')) {
        localStorage.removeItem(key);
      }
    });
    
    // Reload page
    window.location.href = '/';
  };

  const handleGoToLogin = () => {
    console.log('[StuckStateRecovery] Navigating to login');
    sessionStorage.clear();
    navigate('/login', { replace: true });
    setShowRecovery(false);
  };

  if (!showRecovery) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-card text-card-foreground border-2 border-orange-500 dark:border-orange-400 rounded-lg shadow-2xl p-6 z-[100] animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">
            Page Not Loading?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            It looks like the page is stuck. Try one of these recovery options:
          </p>
          <div className="flex flex-col gap-2">
            <CustomButton
              onClick={handleClearAndReload}
              variant="default"
              size="sm"
              className="w-full justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Cache & Reload
            </CustomButton>
            <CustomButton
              onClick={handleGoToLogin}
              variant="outline"
              size="sm"
              className="w-full justify-center"
            >
              Go to Login Page
            </CustomButton>
            <button
              onClick={() => setShowRecovery(false)}
              className="text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
