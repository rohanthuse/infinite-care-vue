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
        is_recurring: false
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
    } catch (error) {
      console.error('Error closing leave dialog:', error);
    }
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Leave/Holiday</DialogTitle>
          <DialogDescription>Create a new leave or holiday period</DialogDescription>
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