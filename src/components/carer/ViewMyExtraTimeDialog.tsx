import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MyExtraTimeRecord } from '@/hooks/useMyExtraTime';
import { formatCurrency } from '@/utils/currencyFormatter';

interface ViewMyExtraTimeDialogProps {
  open: boolean;
  onClose: () => void;
  extraTime: MyExtraTimeRecord | null;
}

export const ViewMyExtraTimeDialog: React.FC<ViewMyExtraTimeDialogProps> = ({
  open,
  onClose,
  extraTime,
}) => {
  if (!extraTime) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      rejected: 'bg-destructive/10 text-destructive',
      paid: 'bg-success/10 text-success',
    } as const;

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extra Time Details</DialogTitle>
          <DialogDescription>
            View extra time claim details and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Work Date</h4>
              <p className="text-sm">{format(new Date(extraTime.work_date), 'dd/MM/yyyy')}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
              {getStatusBadge(extraTime.invoiced ? 'paid' : extraTime.status)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Scheduled Time</h4>
              <p className="text-sm">{extraTime.scheduled_start_time} - {extraTime.scheduled_end_time}</p>
              <p className="text-xs text-muted-foreground">({formatDuration(extraTime.scheduled_duration_minutes)})</p>
            </div>
            {extraTime.actual_start_time && extraTime.actual_end_time && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Actual Time</h4>
                <p className="text-sm">{extraTime.actual_start_time} - {extraTime.actual_end_time}</p>
                {extraTime.actual_duration_minutes && (
                  <p className="text-xs text-muted-foreground">({formatDuration(extraTime.actual_duration_minutes)})</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Extra Time</h4>
              <p className="text-lg font-semibold">{formatDuration(extraTime.extra_time_minutes)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Hourly Rate</h4>
              <p className="text-sm">{formatCurrency(extraTime.hourly_rate)}/hour</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Total Cost</h4>
              <p className="text-lg font-semibold">{formatCurrency(extraTime.total_cost)}</p>
            </div>
          </div>

          {extraTime.extra_time_rate && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Extra Time Rate</h4>
              <p className="text-sm">{formatCurrency(extraTime.extra_time_rate)}/hour</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h4>
            <p className="text-sm">{format(new Date(extraTime.created_at), 'dd/MM/yyyy HH:mm')}</p>
          </div>

          {extraTime.reason && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Reason</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{extraTime.reason}</p>
            </div>
          )}

          {extraTime.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{extraTime.notes}</p>
            </div>
          )}

          {extraTime.approved_at && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved Date</h4>
                <p className="text-sm">{format(new Date(extraTime.approved_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              {extraTime.approved_by && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved By</h4>
                  <p className="text-sm">{extraTime.approved_by}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};