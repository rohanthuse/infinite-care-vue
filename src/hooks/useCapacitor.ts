import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

export interface CapacitorInfo {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  isIOS: boolean;
  isAndroid: boolean;
  isWeb: boolean;
}

/**
 * Hook to detect if the app is running in a native Capacitor environment
 * Useful for conditionally showing native-only features or adjusting UI
 */
export const useCapacitor = (): CapacitorInfo => {
  const [info, setInfo] = useState<CapacitorInfo>(() => {
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    const isNative = Capacitor.isNativePlatform();
    
    return {
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web'
    };
  });

  useEffect(() => {
    // Re-check on mount in case of any async platform detection
    const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
    const isNative = Capacitor.isNativePlatform();
    
    setInfo({
      isNative,
      platform,
      isIOS: platform === 'ios',
      isAndroid: platform === 'android',
      isWeb: platform === 'web'
    });
  }, []);

  return info;
};

/**
 * Simple function to check if running in native environment
 * Use this for quick checks outside of React components
 */
export const isNativeApp = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform
 */
export const getPlatform = (): 'ios' | 'android' | 'web' => {
  return Capacitor.getPlatform() as 'ios' | 'android' | 'web';
};
