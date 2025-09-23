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

  const openDialog = useCallback((id: string) => {
    // Close any currently open dialogs to prevent multiple modals
    setDialogs(prev => prev.map(d => ({ 
      ...d, 
      isOpen: d.id === id ? true : false 
    })));
  }, []);

  const closeDialog = useCallback((id: string) => {
    setDialogs(prev => prev.map(d => 
      d.id === id ? { ...d, isOpen: false } : d
    ));
  }, []);

  const closeAllDialogs = useCallback(() => {
    dialogs.forEach(dialog => {
      if (dialog.isOpen) {
        dialog.onClose();
      }
    });
    setDialogs(prev => prev.map(d => ({ ...d, isOpen: false })));
  }, [dialogs]);

  const isDialogOpen = useCallback((id: string) => {
    return dialogs.find(d => d.id === id)?.isOpen || false;
  }, [dialogs]);

  return {
    registerDialog,
    openDialog,
    closeDialog,
    closeAllDialogs,
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
      openDialog(id);
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