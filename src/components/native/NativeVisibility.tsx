import React from 'react';
import { useNativeAppMode } from '@/contexts/NativeAppContext';

interface NativeOnlyProps {
  children: React.ReactNode;
  /** Fallback content to show on web */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when running in native Capacitor environment
 */
export const NativeOnly: React.FC<NativeOnlyProps> = ({ children, fallback = null }) => {
  const { isNative } = useNativeAppMode();
  return isNative ? <>{children}</> : <>{fallback}</>;
};

interface WebOnlyProps {
  children: React.ReactNode;
  /** Fallback content to show on native */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when running in web browser (not native)
 */
export const WebOnly: React.FC<WebOnlyProps> = ({ children, fallback = null }) => {
  const { isNative } = useNativeAppMode();
  return !isNative ? <>{children}</> : <>{fallback}</>;
};

interface HideInCarerAppProps {
  children: React.ReactNode;
}

/**
 * Hides children when running in the native carer app
 * Used to hide admin navigation, system routes, etc.
 */
export const HideInCarerApp: React.FC<HideInCarerAppProps> = ({ children }) => {
  const { appMode } = useNativeAppMode();
  return appMode !== 'carer' ? <>{children}</> : null;
};

interface ShowInCarerAppProps {
  children: React.ReactNode;
}

/**
 * Shows children only when running in the native carer app
 * Used for carer-specific native features
 */
export const ShowInCarerApp: React.FC<ShowInCarerAppProps> = ({ children }) => {
  const { appMode } = useNativeAppMode();
  return appMode === 'carer' ? <>{children}</> : null;
};
