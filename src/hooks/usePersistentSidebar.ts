import { useState, useEffect } from 'react';

export const usePersistentSidebar = (branchId?: string) => {
  const getStorageKey = () => `sidebar-state-${branchId || 'default'}`;
  
  const [open, setOpenState] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    const stored = localStorage.getItem(getStorageKey());
    if (stored !== null) {
      return JSON.parse(stored);
    }
    
    // Default: open on desktop (≥768px), closed on mobile
    return window.innerWidth >= 768;
  });

  const setOpen = (newOpen: boolean | ((prev: boolean) => boolean)) => {
    const finalOpen = typeof newOpen === 'function' ? newOpen(open) : newOpen;
    setOpenState(finalOpen);
    localStorage.setItem(getStorageKey(), JSON.stringify(finalOpen));
  };

  const toggle = () => setOpen(prev => !prev);

  // Update storage when branchId changes
  useEffect(() => {
    if (typeof window !== 'undefined' && branchId) {
      const stored = localStorage.getItem(getStorageKey());
      const storedOpen = stored ? JSON.parse(stored) : false;
      setOpenState(storedOpen);
    }
  }, [branchId]);

  return {
    open,
    setOpen,
    toggle
  };
};