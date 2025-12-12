import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useCreateAnnualLeave } from '@/hooks/useLeaveManagement';

interface NewLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  prefilledDate?: Date;
}

export const NewLeaveDialog: React.FC<NewLeaveDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  prefilledDate
}) => {
  const [title, setTitle] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [endDate, setEndDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [description, setDescription] = useState('');
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  const createAnnualLeave = useCreateAnnualLeave();

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'bank_holiday', label: 'Bank Holiday' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'training', label: 'Training Day' },
    { value: 'other', label: 'Other' }
  ];

  const resetForm = () => {
    setTitle('');
    setLeaveType('');
    setStartDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setEndDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setDescription('');
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
  };

  const handleScheduleLeave = async () => {
    if (!title || !leaveType || !startDate || !endDate || !branchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createAnnualLeave.mutateAsync({
        branch_id: branchId,
        leave_name: title,
        leave_date: startDate,
        is_company_wide: true,
        is_recurring: false,
        start_time: isAllDay ? null : startTime,
        end_time: isAllDay ? null : endTime
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling leave:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleClose = useCallback(() => {
    try {
      resetForm();
      onOpenChange(false);
      
      // Comprehensive cleanup to prevent UI freezing
      setTimeout(() => {
        // Remove all aria-hidden and inert attributes
        const elementsToCleanup = [
          document.getElementById('root'),
          document.querySelector('.group\\/sidebar-wrapper'),
          ...document.querySelectorAll('[data-radix-popper-content-wrapper]'),
          ...document.querySelectorAll('[aria-hidden="true"]')
        ];
        
        elementsToCleanup.forEach(element => {
          if (element) {
            element.removeAttribute('aria-hidden');
            element.removeAttribute('inert');
          }
        });
        
        // Remove orphaned portals and restore document state
        document.querySelectorAll('[data-radix-popper-content-wrapper]:empty').forEach(el => el.remove());
        document.body.style.removeProperty('overflow');
        document.documentElement.style.removeProperty('overflow');
        document.body.style.removeProperty('pointer-events');
      }, 50);
    } catch (error) {
      console.error('Error closing leave dialog:', error);
      onOpenChange(false);
    }
  }, [onOpenChange]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      const timeoutId = setTimeout(resetForm, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Leave/Holiday</DialogTitle>
          <DialogDescription>Add a new leave entry or holiday to the organisation calendar.</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Leave Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Holiday, Christmas Break"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="leaveType">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allDay"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="allDay" className="cursor-pointer">All Day</Label>
            </div>
          </div>

          {!isAllDay && (
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about the leave period"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleLeave}
            disabled={!title || !leaveType || !startDate || !endDate || !branchId || createAnnualLeave.isPending}
          >
            {createAnnualLeave.isPending ? 'Adding...' : 'Add Leave'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};