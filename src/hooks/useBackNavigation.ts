import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

interface BackNavigationOptions {
  fallbackPath?: string;
  preserveState?: boolean;
}

export const useBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateBack = useCallback((options?: BackNavigationOptions) => {
    const { fallbackPath, preserveState = true } = options || {};
    
    // Check if there's a previous state stored in location
    const previousState = location.state?.from;
    
    if (previousState && preserveState) {
      navigate(previousState.path, { 
        state: previousState.state,
        replace: false
      });
    } else if (fallbackPath) {
      navigate(fallbackPath);
    } else {
      // Use browser back as fallback
      navigate(-1);
    }
  }, [navigate, location]);

  const navigateWithState = useCallback((path: string, state?: any) => {
    navigate(path, {
      state: {
        ...state,
        from: {
          path: location.pathname,
          state: location.state
        }
      }
    });
  }, [navigate, location]);

  return { 
    navigateBack, 
    navigateWithState,
    currentPath: location.pathname,
    currentState: location.state
  };
};
