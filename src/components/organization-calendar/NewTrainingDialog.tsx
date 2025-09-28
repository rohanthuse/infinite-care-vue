import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTenantAwareQuery } from '@/hooks/useTenantAware';
import { supabase } from '@/integrations/supabase/client';
import { useScheduleTraining } from '@/hooks/useTrainingCalendar';

interface NewTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: string;
  prefilledDate?: Date;
}

export const NewTrainingDialog: React.FC<NewTrainingDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  prefilledDate
}) => {
  const [trainingCourseId, setTrainingCourseId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [time, setTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const scheduleTraining = useScheduleTraining();

  // Fetch training courses
  const { data: trainingCourses } = useTenantAwareQuery(
    ['training-courses'],
    async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data || [];
    }
  );

  // Fetch staff
  const { data: staff } = useTenantAwareQuery(
    ['branch-staff', branchId],
    async () => {
      if (!branchId) return [];
      
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .eq('branch_id', branchId)
        .eq('status', 'active');
      
      if (error) throw error;
      return data?.map(member => ({
        ...member,
        name: `${member.first_name} ${member.last_name}`
      })) || [];
    },
    { enabled: !!branchId }
  );

  const resetForm = () => {
    setTrainingCourseId('');
    setStaffId('');
    setDate(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
    setTime('09:00');
    setEndTime('17:00');
    setLocation('');
    setNotes('');
  };

  const handleScheduleTraining = async () => {
    if (!trainingCourseId || !staffId || !date || !branchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await scheduleTraining.mutateAsync({
        training_course_id: trainingCourseId,
        staff_id: staffId,
        branch_id: branchId,
        scheduled_date: date,
        scheduled_time: time,
        end_time: endTime,
        location,
        notes
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling training:', error);
      // Error toast is handled by the mutation
    }
  };

  const handleClose = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Training</DialogTitle>
          <DialogDescription>Create a new training session</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="trainingCourse">Training Course</Label>
            <SafeSelect value={trainingCourseId} onValueChange={setTrainingCourseId}>
              <SafeSelectTrigger>
                <SafeSelectValue placeholder="Select training course" />
              </SafeSelectTrigger>
              <SafeSelectContent>
                {trainingCourses?.map((course) => (
                  <SafeSelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SafeSelectItem>
                ))}
              </SafeSelectContent>
            </SafeSelect>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff">Staff Member</Label>
            <SafeSelect value={staffId} onValueChange={setStaffId}>
              <SafeSelectTrigger>
                <SafeSelectValue placeholder="Select staff member" />
              </SafeSelectTrigger>
              <SafeSelectContent>
                {staff?.map((member) => (
                  <SafeSelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SafeSelectItem>
                ))}
              </SafeSelectContent>
            </SafeSelect>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Start Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
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

          <div className="grid gap-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Training Room A, Online"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the training session"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleScheduleTraining}
            disabled={!trainingCourseId || !staffId || !date || !branchId || scheduleTraining.isPending}
          >
            {scheduleTraining.isPending ? 'Scheduling...' : 'Schedule Training'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};