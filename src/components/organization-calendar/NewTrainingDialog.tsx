import React, { useState, useCallback } from 'react';
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
  prefilledTime?: string;
}

export const NewTrainingDialog: React.FC<NewTrainingDialogProps> = ({
  open,
  onOpenChange,
  branchId,
  prefilledDate,
  prefilledTime
}) => {
  // Calculate initial end time (8 hours after start for full-day training)
  const getInitialEndTime = (startTime?: string) => {
    if (!startTime) return '17:00';
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 8) % 24;
    return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };
  
  const [trainingCourseId, setTrainingCourseId] = useState('');
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(prefilledDate ? format(prefilledDate, 'yyyy-MM-dd') : '');
  const [time, setTime] = useState(prefilledTime || '09:00');
  const [endTime, setEndTime] = useState(getInitialEndTime(prefilledTime));
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
    setTime(prefilledTime || '09:00');
    setEndTime(getInitialEndTime(prefilledTime));
    setLocation('');
    setNotes('');
  };

  const handleScheduleTraining = async () => {
    if (!trainingCourseId || !staffId || !date || !branchId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Combine time/location info into notes since DB only stores date and training_notes
      const timeLocationInfo = [
        time && endTime ? `Time: ${time} - ${endTime}` : '',
        location ? `Location: ${location}` : ''
      ].filter(Boolean).join(' | ');
      
      const combinedNotes = [timeLocationInfo, notes].filter(Boolean).join('\n');
      
      console.log('🔍 Scheduling training with data:', {
        training_course_id: trainingCourseId,
        staff_id: staffId,
        branch_id: branchId,
        scheduled_date: date,
        notes: combinedNotes
      });

      await scheduleTraining.mutateAsync({
        training_course_id: trainingCourseId,
        staff_id: staffId,
        branch_id: branchId,
        scheduled_date: date,
        notes: combinedNotes
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error scheduling training:', error);
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
      console.error('Error closing training dialog:', error);
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
          <DialogTitle>Schedule Training</DialogTitle>
          <DialogDescription>Schedule a new training session for staff members with available courses.</DialogDescription>
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
          <Button variant="outline" onClick={handleClose}>
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