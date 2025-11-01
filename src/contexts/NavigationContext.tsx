import React, { createContext, useContext, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface NavigationState {
  path: string;
  state?: any;
  scrollPosition?: number;
  timestamp: number;
}

interface NavigationContextType {
  previousState: NavigationState | null;
  saveNavigationState: (state?: any) => void;
  clearNavigationState: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [previousState, setPreviousState] = useState<NavigationState | null>(null);
  const location = useLocation();

  const saveNavigationState = useCallback((state?: any) => {
    setPreviousState({
      path: location.pathname,
      state: state || location.state,
      scrollPosition: window.scrollY,
      timestamp: Date.now()
    });
  }, [location]);

  const clearNavigationState = useCallback(() => {
    setPreviousState(null);
  }, []);

  return (
    <NavigationContext.Provider value={{ previousState, saveNavigationState, clearNavigationState }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationContext must be used within NavigationProvider');
  }
  return context;
};
