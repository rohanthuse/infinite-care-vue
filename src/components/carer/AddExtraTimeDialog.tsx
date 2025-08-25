import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCarerExtraTimeManagement } from '@/hooks/useCarerExtraTimeManagement';
import { useToast } from '@/hooks/use-toast';

interface AddExtraTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddExtraTimeDialog = ({ open, onOpenChange }: AddExtraTimeDialogProps) => {
  const { toast } = useToast();
  const { createExtraTimeRecord } = useCarerExtraTimeManagement();

  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    scheduled_start_time: '',
    scheduled_end_time: '',
    actual_start_time: '',
    actual_end_time: '',
    hourly_rate: '',
    extra_time_rate: '',
    reason: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createExtraTimeRecord.mutateAsync({
        ...formData,
        hourly_rate: parseFloat(formData.hourly_rate),
        extra_time_rate: formData.extra_time_rate ? parseFloat(formData.extra_time_rate) : undefined,
      });

      toast({
        title: "Success",
        description: "Extra time record submitted for approval",
      });

      onOpenChange(false);
      setFormData({
        work_date: new Date().toISOString().split('T')[0],
        scheduled_start_time: '',
        scheduled_end_time: '',
        actual_start_time: '',
        actual_end_time: '',
        hourly_rate: '',
        extra_time_rate: '',
        reason: '',
        notes: '',
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit extra time record",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submit Extra Time Request</DialogTitle>
          <DialogDescription>
            Submit your overtime/extra time for approval and payment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="work_date">Work Date</Label>
            <Input
              id="work_date"
              type="date"
              value={formData.work_date}
              onChange={(e) => handleInputChange('work_date', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled_start_time">Scheduled Start Time</Label>
              <Input
                id="scheduled_start_time"
                type="time"
                value={formData.scheduled_start_time}
                onChange={(e) => handleInputChange('scheduled_start_time', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled_end_time">Scheduled End Time</Label>
              <Input
                id="scheduled_end_time"
                type="time"
                value={formData.scheduled_end_time}
                onChange={(e) => handleInputChange('scheduled_end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual_start_time">Actual Start Time</Label>
              <Input
                id="actual_start_time"
                type="time"
                value={formData.actual_start_time}
                onChange={(e) => handleInputChange('actual_start_time', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actual_end_time">Actual End Time</Label>
              <Input
                id="actual_end_time"
                type="time"
                value={formData.actual_end_time}
                onChange={(e) => handleInputChange('actual_end_time', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
              <Input
                id="hourly_rate"
                type="number"
                step="0.01"
                value={formData.hourly_rate}
                onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                placeholder="e.g., 15.50"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extra_time_rate">Overtime Rate (£)</Label>
              <Input
                id="extra_time_rate"
                type="number"
                step="0.01"
                value={formData.extra_time_rate}
                onChange={(e) => handleInputChange('extra_time_rate', e.target.value)}
                placeholder="Auto: 1.5x hourly rate"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Extra Time</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="e.g., Client emergency, extended care needs"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional details about the extra time worked"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createExtraTimeRecord.isPending}
            >
              {createExtraTimeRecord.isPending ? 'Submitting...' : 'Submit Extra Time'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};