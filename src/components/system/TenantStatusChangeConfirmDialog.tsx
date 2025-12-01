import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AlertTriangle, Ban, Pause } from 'lucide-react';

interface TenantStatusChangeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantName: string;
  currentStatus: string;
  newStatus: string;
  onConfirm: () => void;
}

export const TenantStatusChangeConfirmDialog: React.FC<TenantStatusChangeConfirmDialogProps> = ({
  open,
  onOpenChange,
  tenantName,
  currentStatus,
  newStatus,
  onConfirm,
}) => {
  const getStatusIcon = () => {
    if (newStatus === 'suspended') return <Ban className="h-5 w-5 text-destructive" />;
    if (newStatus === 'inactive') return <Pause className="h-5 w-5 text-muted-foreground" />;
    return <AlertTriangle className="h-5 w-5 text-amber-600" />;
  };

  const getStatusMessage = () => {
    if (newStatus === 'suspended') {
      return 'This will suspend the tenant immediately. All users will lose access to the system until reactivated.';
    }
    if (newStatus === 'inactive') {
      return 'This will mark the tenant as inactive. Users may still be able to access the system with limited functionality.';
    }
    return `This will change the tenant status from ${currentStatus} to ${newStatus}.`;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>
              You are about to change the status of <strong>{tenantName}</strong> from{' '}
              <span className="capitalize font-medium">{currentStatus}</span> to{' '}
              <span className="capitalize font-medium">{newStatus}</span>.
            </p>
            <p className="text-foreground">{getStatusMessage()}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={newStatus === 'suspended' ? 'bg-destructive hover:bg-destructive/90' : ''}>
            Confirm Change
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
