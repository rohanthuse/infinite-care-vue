import { useState, useEffect } from 'react';
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
import {
  SafeSelectWrapper as Select,
  SafeSelectContent as SelectContent,
  SafeSelectItem as SelectItem,
  SafeSelectTrigger as SelectTrigger,
  SafeSelectValue as SelectValue,
} from '@/components/ui/safe-select';
import { useCarerExtraTimeEdit } from '@/hooks/useCarerExtraTimeEdit';
import { useCarerAssignedClients } from '@/hooks/useCarerAssignedClients';
import { MyExtraTimeRecord } from '@/hooks/useMyExtraTime';

interface EditExtraTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extraTime: MyExtraTimeRecord | null;
}

export const EditExtraTimeDialog = ({ open, onOpenChange, extraTime }: EditExtraTimeDialogProps) => {
  const { updateExtraTime } = useCarerExtraTimeEdit();
  const { data: assignedClients = [], isLoading: loadingClients } = useCarerAssignedClients();

  const [formData, setFormData] = useState({
    work_date: '',
    scheduled_start_time: '',
    scheduled_end_time: '',
    actual_start_time: '',
    actual_end_time: '',
    hourly_rate: '',
    extra_time_rate: '',
    reason: '',
    notes: '',
    client_id: '',
  });

  useEffect(() => {
    if (extraTime) {
      setFormData({
        work_date: extraTime.work_date,
        scheduled_start_time: extraTime.scheduled_start_time,
        scheduled_end_time: extraTime.scheduled_end_time,
        actual_start_time: extraTime.actual_start_time || '',
        actual_end_time: extraTime.actual_end_time || '',
        hourly_rate: extraTime.hourly_rate.toString(),
        extra_time_rate: extraTime.extra_time_rate?.toString() || '',
        reason: extraTime.reason || '',
        notes: extraTime.notes || '',
        client_id: '', // Would need client_id in type
      });
    }
  }, [extraTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTime) return;

    try {
      await updateExtraTime.mutateAsync({
        id: extraTime.id,
        work_date: formData.work_date,
        scheduled_start_time: formData.scheduled_start_time,
        scheduled_end_time: formData.scheduled_end_time,
        actual_start_time: formData.actual_start_time,
        actual_end_time: formData.actual_end_time,
        hourly_rate: parseFloat(formData.hourly_rate),
        extra_time_rate: formData.extra_time_rate ? parseFloat(formData.extra_time_rate) : undefined,
        reason: formData.reason || undefined,
        notes: formData.notes || undefined,
        client_id: formData.client_id || undefined,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!extraTime) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Extra Time Record</DialogTitle>
          <DialogDescription>
            Update your pending extra time claim details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label htmlFor="client_id">Client (Optional)</Label>
              <Select
                value={formData.client_id || 'none'}
                onValueChange={(value) => handleInputChange('client_id', value === 'none' ? '' : value)}
                disabled={loadingClients}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? "Loading..." : "Select client"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific client</SelectItem>
                  {assignedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateExtraTime.isPending}>
              {updateExtraTime.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
