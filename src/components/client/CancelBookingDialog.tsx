import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubmitCancellationRequest } from '@/hooks/useBookingChangeRequest';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: {
    id: string;
    appointment_type: string;
    provider_name: string;
    appointment_date: string;
    appointment_time: string;
    location: string;
    client_id?: string;
    branch_id?: string;
    organization_id?: string;
  } | null;
  onSubmit?: (data: { reason: string; notes?: string }) => void;
  isLoading?: boolean;
}

const cancellationReasons = [
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'personal_circumstances', label: 'Personal Circumstances' },
  { value: 'no_longer_needed', label: 'No Longer Needed' },
  { value: 'schedule_conflict', label: 'Schedule Conflict' },
  { value: 'other', label: 'Other' },
];

export function CancelBookingDialog({
  open,
  onOpenChange,
  booking,
  onSubmit,
  isLoading: externalLoading = false,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const submitCancellationMutation = useSubmitCancellationRequest();

  const handleSubmit = async () => {
    if (!reason || !booking) return;

    try {
      await submitCancellationMutation.mutateAsync({
        bookingId: booking.id,
        clientId: booking.client_id!,
        branchId: booking.branch_id!,
        organizationId: booking.organization_id,
        reason,
        notes: notes || undefined,
      });

      // Reset and close
      setReason('');
      setNotes('');
      onOpenChange(false);
      
      // Call parent onSubmit if provided
      onSubmit?.({ reason, notes });
    } catch (error) {
      console.error('[CancelBookingDialog] Error:', error);
    }
  };

  const isLoading = submitCancellationMutation.isPending || externalLoading;

  const handleCancel = () => {
    setReason('');
    setNotes('');
    onOpenChange(false);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Cancellation</DialogTitle>
          <DialogDescription>
            Submit a request to cancel this appointment. Your request will be reviewed by an
            administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Appointment Details */}
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service:</span>
              <span className="font-medium">{booking.appointment_type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium">{booking.provider_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date & Time:</span>
              <span className="font-medium">
                {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                {booking.appointment_time}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Location:</span>
              <span className="font-medium">{booking.location}</span>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This appointment will remain active until an administrator approves your cancellation
              request.
            </AlertDescription>
          </Alert>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for Cancellation <span className="text-destructive">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {cancellationReasons.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Provide any additional information about your cancellation request..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || isLoading}
          >
            {isLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
