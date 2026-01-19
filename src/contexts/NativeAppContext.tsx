import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';

export interface NativeAppMode {
  /** Whether running in a native Capacitor shell */
  isNative: boolean;
  /** The app mode: 'carer' for carer-only native app, 'full' for web app */
  appMode: 'carer' | 'full';
  /** Current platform */
  platform: 'ios' | 'android' | 'web';
  /** Whether to hide admin/system navigation */
  hideAdminNav: boolean;
  /** Whether to hide client navigation */
  hideClientNav: boolean;
  /** Stored tenant slug for native app */
  storedTenantSlug: string | null;
  /** Set the tenant slug for native app persistence */
  setStoredTenantSlug: (slug: string) => void;
  /** Clear stored tenant (for logout) */
  clearStoredTenant: () => void;
}

const NATIVE_TENANT_KEY = 'native_carer_tenant';

const defaultContext: NativeAppMode = {
  isNative: false,
  appMode: 'full',
  platform: 'web',
  hideAdminNav: false,
  hideClientNav: false,
  storedTenantSlug: null,
  setStoredTenantSlug: () => {},
  clearStoredTenant: () => {}
};

const NativeAppContext = createContext<NativeAppMode>(defaultContext);

export const useNativeAppMode = (): NativeAppMode => {
  const context = useContext(NativeAppContext);
  if (!context) {
    throw new Error('useNativeAppMode must be used within NativeAppProvider');
  }
  return context;
};

interface NativeAppProviderProps {
  children: ReactNode;
}

export const NativeAppProvider: React.FC<NativeAppProviderProps> = ({ children }) => {
  const [storedTenantSlug, setStoredTenantSlugState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(NATIVE_TENANT_KEY);
    } catch {
      return null;
    }
  });

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  
  // In native mode, we're always in carer-only mode
  const appMode = isNative ? 'carer' : 'full';
  
  // Hide admin and client navigation in native carer app
  const hideAdminNav = isNative;
  const hideClientNav = isNative;

  const setStoredTenantSlug = (slug: string) => {
    try {
      localStorage.setItem(NATIVE_TENANT_KEY, slug);
      setStoredTenantSlugState(slug);
      console.log('[NativeAppMode] Stored tenant slug:', slug);
    } catch (err) {
      console.error('[NativeAppMode] Failed to store tenant slug:', err);
    }
  };

  const clearStoredTenant = () => {
    try {
      localStorage.removeItem(NATIVE_TENANT_KEY);
      setStoredTenantSlugState(null);
      console.log('[NativeAppMode] Cleared stored tenant');
    } catch (err) {
      console.error('[NativeAppMode] Failed to clear tenant:', err);
    }
  };

  useEffect(() => {
    console.log('[NativeAppMode] Initialized:', {
      isNative,
      platform,
      appMode,
      storedTenantSlug
    });
  }, [isNative, platform, appMode, storedTenantSlug]);

  const value: NativeAppMode = {
    isNative,
    appMode,
    platform,
    hideAdminNav,
    hideClientNav,
    storedTenantSlug,
    setStoredTenantSlug,
    clearStoredTenant
  };

  return (
    <NativeAppContext.Provider value={value}>
      {children}
    </NativeAppContext.Provider>
  );
};
