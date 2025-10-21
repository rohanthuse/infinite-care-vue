import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";

interface DialogState {
  id: string;
  isOpen: boolean;
  onClose: () => void;
}

export function useDialogManager() {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const location = useLocation();
  const previousLocation = useRef(location.pathname);

  // Auto-close all dialogs on route change
  useEffect(() => {
    if (previousLocation.current !== location.pathname) {
      dialogs.forEach(dialog => {
        if (dialog.isOpen) {
          dialog.onClose();
        }
      });
      setDialogs([]);
    }
    previousLocation.current = location.pathname;
  }, [location.pathname, dialogs]);

  // Close any open dropdowns before opening dialogs - but don't interfere with dialogs
  const closeAllDropdowns = useCallback(() => {
    // Find and close radix dropdown menus specifically (not dialogs)
    const openDropdowns = document.querySelectorAll('[data-radix-dropdown-menu-content][data-state="open"]');
    openDropdowns.forEach(dropdown => {
      // Find the trigger for this dropdown
      const trigger = document.querySelector(`[data-radix-dropdown-menu-trigger][aria-expanded="true"]`);
      if (trigger) {
        (trigger as HTMLElement).click();
      }
    });
    
    // Force cleanup after a brief delay to ensure portals are removed
    setTimeout(() => {
      // Remove any closed dropdown content elements
      const closedDropdowns = document.querySelectorAll('[data-radix-dropdown-menu-content][data-state="closed"]');
      closedDropdowns.forEach(dropdown => dropdown.remove());
      
      // Clean up any lingering state
      document.body.style.removeProperty('pointer-events');
      document.documentElement.style.removeProperty('pointer-events');
      
      const root = document.getElementById('root');
      if (root) {
        root.removeAttribute('inert');
        root.removeAttribute('aria-hidden');
      }
    }, 100);
  }, []);

  const registerDialog = useCallback((id: string, onClose: () => void) => {
    setDialogs(prev => {
      const existing = prev.find(d => d.id === id);
      if (existing) {
        return prev.map(d => d.id === id ? { ...d, onClose } : d);
      }
      return [...prev, { id, isOpen: false, onClose }];
    });

    return () => {
      setDialogs(prev => prev.filter(d => d.id !== id));
    };
  }, []);

  const openDialog = useCallback((id: string, closeDropdownsFirst = true) => {
    if (closeDropdownsFirst) {
      closeAllDropdowns();
    }
    setDialogs(prev => prev.map(d => ({ 
      ...d, 
      isOpen: d.id === id ? true : false 
    })));
  }, [closeAllDropdowns]);

  const closeDialog = useCallback((id: string) => {
    setDialogs(prev => prev.map(d => 
      d.id === id ? { ...d, isOpen: false } : d
    ));
  }, []);

  const closeAllDialogs = useCallback(() => {
    try {
      dialogs.forEach(dialog => {
        if (dialog.isOpen) {
          dialog.onClose();
        }
      });
      setDialogs(prev => prev.map(d => ({ ...d, isOpen: false })));
      
      // Enhanced cleanup for any lingering UI states
      setTimeout(() => {
        // Remove any lingering overlay or focus trap attributes
        const appRoot = document.getElementById('root');
        if (appRoot) {
          appRoot.removeAttribute('aria-hidden');
          appRoot.removeAttribute('inert');
        }
        
        // Ensure body can scroll and interact
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
        document.documentElement.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('pointer-events');
        
        // Remove any lingering Radix portals (dropdowns, popovers, etc.)
        const stalePortals = document.querySelectorAll('[data-radix-dropdown-menu-content], [data-radix-popover-content]');
        stalePortals.forEach(portal => {
          if (portal.getAttribute('data-state') === 'closed') {
            portal.remove();
          }
        });
      }, 50);
    } catch (error) {
      console.error('Error closing all dialogs:', error);
    }
  }, [dialogs]);

  const isDialogOpen = useCallback((id: string) => {
    return dialogs.find(d => d.id === id)?.isOpen || false;
  }, [dialogs]);

  return {
    registerDialog,
    openDialog,
    closeDialog,
    closeAllDialogs,
    closeAllDropdowns,
    isDialogOpen,
    hasOpenDialogs: dialogs.some(d => d.isOpen)
  };
}

export function useControlledDialog(id: string, initialOpen = false) {
  const [open, setOpen] = useState(initialOpen);
  const { registerDialog, openDialog, closeDialog, isDialogOpen } = useDialogManager();

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      openDialog(id, true); // Always close dropdowns when opening dialog
    } else {
      closeDialog(id);
    }
  }, [id, openDialog, closeDialog]);

  const handleClose = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  // Register dialog on mount
  useEffect(() => {
    const unregister = registerDialog(id, handleClose);
    return unregister;
  }, [id, registerDialog, handleClose]);

  return {
    open,
    onOpenChange: handleOpenChange,
    onClose: handleClose
  };
}