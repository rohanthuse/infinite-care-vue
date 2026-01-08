import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCarePlanStatusChange } from '@/hooks/useCarePlanStatusChange';
import { useControlledDialog } from '@/hooks/useDialogManager';
import { RefreshCw } from 'lucide-react';

interface CarePlan {
  id: string;
  display_id: string;
  status: string;
  client: {
    first_name: string;
    last_name: string;
  };
}

interface CarePlanStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carePlan: CarePlan | null;
}

// Define allowed status transitions for admin
const statusTransitions: Record<string, string[]> = {
  'draft': ['pending_client_approval', 'archived'],
  'pending_client_approval': ['active', 'draft', 'on_hold', 'archived'],
  'active': ['on_hold', 'completed', 'archived'],
  'approved': ['active', 'on_hold', 'archived'],
  'rejected': ['draft', 'pending_client_approval', 'archived'],
  'on_hold': ['active', 'completed', 'archived'],
  'completed': ['archived', 'active'],
  'archived': [], // Final state - no transitions
};

const statusLabels: Record<string, string> = {
  'draft': 'Draft',
  'pending_client_approval': 'Pending Client Approval',
  'active': 'Active',
  'approved': 'Client Approved',
  'rejected': 'Changes Requested',
  'on_hold': 'On Hold',
  'completed': 'Completed',
  'archived': 'Archived',
};

export const CarePlanStatusChangeDialog: React.FC<CarePlanStatusChangeDialogProps> = ({
  open,
  onOpenChange,
  carePlan,
}) => {
  const dialogId = `care-plan-status-change-${carePlan?.id || 'unknown'}`;
  const controlledDialog = useControlledDialog(dialogId, open);
  
  const [newStatus, setNewStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const { changeStatus, isChanging } = useCarePlanStatusChange();

  // Force UI unlock function for comprehensive cleanup
  const forceUIUnlock = useCallback(() => {
    // Remove any stuck overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-alert-dialog-overlay]');
    overlays.forEach(overlay => overlay.remove());
    
    // Remove aria-hidden and inert from any elements
    document.querySelectorAll('[aria-hidden="true"], [inert]').forEach(el => {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
    });
    
    // Aggressive body/html cleanup
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('pointer-events');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('pointer-events');
    document.body.classList.remove('overflow-hidden');
    document.documentElement.classList.remove('overflow-hidden');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('data-scroll-locked');
  }, []);

  // Sync with parent state and ensure proper cleanup
  const handleOpenChange = useCallback((newOpen: boolean) => {
    controlledDialog.onOpenChange(newOpen);
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(forceUIUnlock, 50);
    }
  }, [controlledDialog, onOpenChange, forceUIUnlock]);

  const currentStatus = carePlan?.status || 'draft';
  const allowedTransitions = statusTransitions[currentStatus] || [];

  const handleSubmit = () => {
    if (!carePlan || !newStatus) return;

    changeStatus(
      { carePlanId: carePlan.id, newStatus, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setNewStatus('');
          setReason('');
          handleOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    setNewStatus('');
    setReason('');
    handleOpenChange(false);
  };

  if (!carePlan) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px]"
        onCloseAutoFocus={() => setTimeout(forceUIUnlock, 50)}
        onEscapeKeyDown={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
        onPointerDownOutside={() => {
          handleOpenChange(false);
          setTimeout(forceUIUnlock, 50);
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Change Care Plan Status
          </DialogTitle>
          <DialogDescription>
            Update the status for {carePlan.client.first_name} {carePlan.client.last_name}'s care plan ({carePlan.display_id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <Badge variant="outline" className="text-base px-3 py-1">
              {statusLabels[currentStatus] || currentStatus}
            </Badge>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            {allowedTransitions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No status transitions available from this state.
              </p>
            ) : (
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status] || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isChanging}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!newStatus || isChanging || allowedTransitions.length === 0}
          >
            {isChanging ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
