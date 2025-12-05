import React from 'react';
import { Outlet } from 'react-router-dom';
import { SystemAuthProvider } from '@/contexts/SystemAuthContext';

/**
 * Layout wrapper for all system routes.
 * Provides a single SystemAuthProvider instance that persists across all system route navigation.
 */
export const SystemRoutesLayout: React.FC = () => {
  return (
    <SystemAuthProvider>
      <Outlet />
    </SystemAuthProvider>
  );
};
