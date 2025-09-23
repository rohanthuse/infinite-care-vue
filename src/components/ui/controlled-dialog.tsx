import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useControlledDialog } from "@/hooks/useDialogManager";

interface ControlledDialogProps {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: any) => void;
}

export function ControlledDialog({
  id,
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  onEscapeKeyDown,
  onPointerDownOutside,
}: ControlledDialogProps) {
  // Use controlled dialog for proper cleanup and route change handling
  const controlledDialog = useControlledDialog(id, open);
  
  // Sync with external open/onOpenChange props
  React.useEffect(() => {
    if (open !== controlledDialog.open) {
      controlledDialog.onOpenChange(open);
    }
  }, [open, controlledDialog.open, controlledDialog.onOpenChange]);
  
  React.useEffect(() => {
    onOpenChange(controlledDialog.open);
  }, [controlledDialog.open, onOpenChange]);

  const handleEscapeKeyDown = React.useCallback((event: KeyboardEvent) => {
    onEscapeKeyDown?.(event);
    controlledDialog.onOpenChange(false);
  }, [onEscapeKeyDown, controlledDialog.onOpenChange]);

  const handlePointerDownOutside = React.useCallback((event: any) => {
    onPointerDownOutside?.(event);
    controlledDialog.onOpenChange(false);
  }, [onPointerDownOutside, controlledDialog.onOpenChange]);

  return (
    <Dialog open={controlledDialog.open} onOpenChange={controlledDialog.onOpenChange}>
      <DialogContent 
        className={className}
        onEscapeKeyDown={handleEscapeKeyDown}
        onPointerDownOutside={handlePointerDownOutside}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}