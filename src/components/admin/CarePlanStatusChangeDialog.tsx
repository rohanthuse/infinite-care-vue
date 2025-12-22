import React, { useState } from 'react';
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
  const [newStatus, setNewStatus] = useState<string>('');
  const [reason, setReason] = useState('');
  const { changeStatus, isChanging } = useCarePlanStatusChange();

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
          onOpenChange(false);
        },
      }
    );
  };

  const handleClose = () => {
    setNewStatus('');
    setReason('');
    onOpenChange(false);
  };

  if (!carePlan) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
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
