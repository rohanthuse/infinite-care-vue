import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { useManageWorkingHours } from '@/hooks/useStaffWorkingHours';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

interface StaffWorkingHoursDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  staffName: string;
  branchId: string;
  organizationId: string;
  initialDate?: Date;
}

export function StaffWorkingHoursDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  branchId,
  organizationId,
  initialDate
}: StaffWorkingHoursDialogProps) {
  const [date, setDate] = useState<Date>(initialDate || new Date());
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');

  const { mutate: saveWorkingHours, isPending } = useManageWorkingHours();

  const handleSave = () => {
    saveWorkingHours({
      staff_id: staffId,
      branch_id: branchId,
      organization_id: organizationId,
      work_date: format(date, 'yyyy-MM-dd'),
      start_time: startTime,
      end_time: endTime,
      availability_type: 'shift',
      status: 'scheduled',
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setNotes('');
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Set Working Hours - {staffName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-md border"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="e.g., Evening shift, On-call"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Working Hours'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
