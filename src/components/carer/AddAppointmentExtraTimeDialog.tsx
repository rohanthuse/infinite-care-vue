import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format, differenceInMinutes } from 'date-fns';
import { Clock, Upload, Loader2, AlertCircle } from 'lucide-react';
import { useCarerExtraTimeManagement } from '@/hooks/useCarerExtraTimeManagement';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { toast } from 'sonner';

interface AddAppointmentExtraTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: {
    id: string;
    client_id?: string;
    start_time: string;
    end_time: string;
    clients?: {
      first_name?: string;
      last_name?: string;
    };
    visit_records?: Array<{
      visit_start_time?: string;
      visit_end_time?: string;
      actual_duration_minutes?: number;
    }>;
  } | null;
}

const formatDuration = (minutes: number): string => {
  if (minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const AddAppointmentExtraTimeDialog: React.FC<AddAppointmentExtraTimeDialogProps> = ({
  open,
  onOpenChange,
  appointment,
}) => {
  const { createExtraTimeRecord } = useCarerExtraTimeManagement();
  const { data: carerProfile } = useCarerProfile();

  const [extraTimeMinutes, setExtraTimeMinutes] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Calculate times from appointment
  const scheduledStart = appointment ? new Date(appointment.start_time) : new Date();
  const scheduledEnd = appointment ? new Date(appointment.end_time) : new Date();
  const visitRecord = appointment?.visit_records?.[0];
  
  const actualStart = visitRecord?.visit_start_time ? new Date(visitRecord.visit_start_time) : null;
  const actualEnd = visitRecord?.visit_end_time ? new Date(visitRecord.visit_end_time) : null;

  const scheduledDuration = Math.max(0, differenceInMinutes(scheduledEnd, scheduledStart));
  const actualDuration = actualStart && actualEnd 
    ? Math.max(0, differenceInMinutes(actualEnd, actualStart)) 
    : 0;

  // Calculate max extra time (actual end - scheduled end)
  const calculatedExtraTime = actualEnd 
    ? Math.max(0, differenceInMinutes(actualEnd, scheduledEnd))
    : 0;

  // Reset form when dialog opens
  useEffect(() => {
    if (open && appointment) {
      setExtraTimeMinutes(calculatedExtraTime);
      setReason('');
      setNotes('');
      setReceiptFile(null);
    }
  }, [open, appointment, calculatedExtraTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!appointment?.id || !carerProfile?.id) {
      toast.error('Missing appointment or profile data');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for the extra time');
      return;
    }

    if (extraTimeMinutes <= 0) {
      toast.error('Extra time must be greater than 0');
      return;
    }

    try {
      // Use a default hourly rate (this can be fetched from staff settings if available)
      const hourlyRate = 15;

      await createExtraTimeRecord.mutateAsync({
        work_date: format(scheduledStart, 'yyyy-MM-dd'),
        scheduled_start_time: format(scheduledStart, 'HH:mm:ss'),
        scheduled_end_time: format(scheduledEnd, 'HH:mm:ss'),
        actual_start_time: actualStart ? format(actualStart, 'HH:mm:ss') : format(scheduledStart, 'HH:mm:ss'),
        actual_end_time: actualEnd ? format(actualEnd, 'HH:mm:ss') : format(new Date(scheduledEnd.getTime() + extraTimeMinutes * 60000), 'HH:mm:ss'),
        hourly_rate: hourlyRate,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        client_id: appointment.client_id,
        booking_id: appointment.id,
      });

      toast.success('Extra time claim submitted successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('[AddAppointmentExtraTimeDialog] Error submitting extra time:', error);
      toast.error('Failed to submit extra time claim');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  const clientName = appointment?.clients
    ? `${appointment.clients.first_name || ''} ${appointment.clients.last_name || ''}`.trim()
    : 'Unknown Client';

  const visitDate = appointment?.start_time
    ? format(new Date(appointment.start_time), 'dd MMM yyyy')
    : '';

  const hasActualTimes = actualStart && actualEnd;
  const canSubmit = reason.trim() && extraTimeMinutes > 0 && extraTimeMinutes <= calculatedExtraTime;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Submit Extra Time Claim
          </DialogTitle>
          <DialogDescription>
            Claim extra time for your visit with {clientName} on {visitDate}
          </DialogDescription>
        </DialogHeader>

        {!hasActualTimes ? (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Actual visit times not recorded. Cannot calculate extra time.</p>
          </div>
        ) : calculatedExtraTime <= 0 ? (
          <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No extra time available. Actual end time is not after scheduled end time.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Time Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Scheduled Time</Label>
                <p className="font-medium">
                  {format(scheduledStart, 'HH:mm')} - {format(scheduledEnd, 'HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">({formatDuration(scheduledDuration)})</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Actual Time</Label>
                <p className="font-medium text-green-600">
                  {actualStart && format(actualStart, 'HH:mm')} - {actualEnd && format(actualEnd, 'HH:mm')}
                </p>
                <p className="text-sm text-muted-foreground">({formatDuration(actualDuration)})</p>
              </div>
            </div>

            {/* Auto-calculated Extra Time */}
            <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auto-calculated Extra Time</Label>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {formatDuration(calculatedExtraTime)}
                </Badge>
              </div>
            </div>

            {/* Extra Time to Claim */}
            <div className="space-y-2">
              <Label htmlFor="extraTime">Extra Time to Claim (max {calculatedExtraTime} min) *</Label>
              <Input
                id="extraTime"
                type="number"
                min={1}
                max={calculatedExtraTime}
                value={extraTimeMinutes}
                onChange={(e) => setExtraTimeMinutes(Math.min(Number(e.target.value), calculatedExtraTime))}
                required
              />
              {extraTimeMinutes > calculatedExtraTime && (
                <p className="text-xs text-destructive">Cannot exceed calculated extra time</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Extra Time *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why extra time was needed..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Receipt Upload */}
            <div className="space-y-2">
              <Label htmlFor="receipt">Attach Receipt (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {receiptFile && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Upload className="h-4 w-4" />
                    {receiptFile.name.length > 15
                      ? `${receiptFile.name.substring(0, 15)}...`
                      : receiptFile.name}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createExtraTimeRecord.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createExtraTimeRecord.isPending || !canSubmit}
              >
                {createExtraTimeRecord.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Extra Time Claim'
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
