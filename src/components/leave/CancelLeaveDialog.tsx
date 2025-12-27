import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, XCircle, Info } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCancelLeaveRequest, type LeaveRequest } from "@/hooks/useLeaveManagement";

interface CancelLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaveRequest: LeaveRequest | null;
}

export function CancelLeaveDialog({ open, onOpenChange, leaveRequest }: CancelLeaveDialogProps) {
  const [cancellationReason, setCancellationReason] = useState('');
  const cancelLeaveRequest = useCancelLeaveRequest();

  const handleCancel = () => {
    if (!leaveRequest) return;

    cancelLeaveRequest.mutate({
      id: leaveRequest.id,
      cancellation_reason: cancellationReason || undefined
    }, {
      onSuccess: () => {
        setCancellationReason('');
        onOpenChange(false);
      }
    });
  };

  const handleClose = () => {
    setCancellationReason('');
    onOpenChange(false);
  };

  if (!leaveRequest) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Cancel Approved Leave
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this approved leave?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Leave Details */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Staff:</span>
                <span className="ml-2 font-medium">{leaveRequest.staff_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Leave Type:</span>
                <span className="ml-2 font-medium capitalize">{leaveRequest.leave_type}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Period:</span>
                <span className="ml-2 font-medium">
                  {format(parseISO(leaveRequest.start_date), 'MMM dd')} - {format(parseISO(leaveRequest.end_date), 'MMM dd, yyyy')} ({leaveRequest.total_days} days)
                </span>
              </div>
            </div>
          </div>

          {/* Impact Info */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">What happens when you cancel:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                  <li>The carer will be available for bookings on these dates</li>
                  <li>Previously reassigned bookings will remain unchanged</li>
                  <li>This action will be logged for audit</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Cancellation Reason (Optional)</Label>
            <Textarea
              id="cancel-reason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Enter reason for cancelling this leave..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Keep Leave
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelLeaveRequest.isPending}
          >
            {cancelLeaveRequest.isPending ? 'Cancelling...' : 'Cancel Leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
