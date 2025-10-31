import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SafeSelect, SafeSelectContent, SafeSelectItem, SafeSelectTrigger, SafeSelectValue } from '@/components/ui/safe-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useUpdateTraining } from '@/hooks/useTrainingCalendar';
import { EnhancedStaffSelector } from '@/components/ui/enhanced-staff-selector';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

interface EditTrainingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  training: any;
  branchId?: string;
}

export const EditTrainingDialog: React.FC<EditTrainingDialogProps> = ({
  open,
  onOpenChange,
  training,
  branchId,
}) => {
  // Parse existing training data
  const timeMatch = training?.training_notes?.match(/Time: (\d{2}:\d{2}) - (\d{2}:\d{2})/);
  const initialStartTime = timeMatch?.[1] || '09:00';
  const initialEndTime = timeMatch?.[2] || '17:00';

  const locationMatch = training?.training_notes?.match(/Location: (.+?)(?:\n|$)/);
  const initialLocation = locationMatch?.[1]?.trim() || '';

  const initialNotes = training?.training_notes
    ?.replace(/Time: .+\n?/, '')
    ?.replace(/Location: .+\n?/, '')
    ?.trim() || '';

  const [courseId, setCourseId] = useState(training?.training_course_id || '');
  const [staffId, setStaffId] = useState<string | undefined>(training?.staff_id);
  const [staffData, setStaffData] = useState<any>(null);
  const [date, setDate] = useState(training?.assigned_date || '');
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [location, setLocation] = useState(initialLocation);
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState(training?.status || 'not-started');
  const [trainingCourses, setTrainingCourses] = useState<any[]>([]);

  const updateTraining = useUpdateTraining();
  const { organization } = useTenant();

  // Fetch organization-wide training courses
  useEffect(() => {
    if (open && organization?.id) {
      (supabase as any)
        .from('training_courses')
        .select('*')
        .eq('organization_id', organization.id)
        .order('title')
        .then(({ data, error }: any) => {
          if (error) {
            console.error('Error fetching training courses:', error);
            return;
          }
          setTrainingCourses(data || []);
        });
    }
  }, [open, organization?.id]);

  // Reset form when training changes
  useEffect(() => {
    if (training && open) {
      const timeMatch = training.training_notes?.match(/Time: (\d{2}:\d{2}) - (\d{2}:\d{2})/);
      const startTime = timeMatch?.[1] || '09:00';
      const endTime = timeMatch?.[2] || '17:00';

      const locationMatch = training.training_notes?.match(/Location: (.+?)(?:\n|$)/);
      const location = locationMatch?.[1]?.trim() || '';

      const cleanNotes = training.training_notes
        ?.replace(/Time: .+\n?/, '')
        ?.replace(/Location: .+\n?/, '')
        ?.trim() || '';

      setCourseId(training.training_course_id || '');
      setStaffId(training.staff_id);
      setDate(training.assigned_date || '');
      setStartTime(startTime);
      setEndTime(endTime);
      setLocation(location);
      setNotes(cleanNotes);
      setStatus(training.status || 'not-started');
    }
  }, [training, open]);

  const handleUpdateTraining = async () => {
    // Validation
    if (!courseId) {
      toast.error("Please select a training course");
      return;
    }
    
    if (!staffId) {
      toast.error("Please select a staff member");
      return;
    }
    
    if (!date) {
      toast.error("Please select a training date");
      return;
    }
    
    if (!startTime || !endTime) {
      toast.error("Please select start and end times");
      return;
    }

    // Validate end time is after start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    if (endTotalMinutes <= startTotalMinutes) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      // Construct training_notes with metadata
      const trainingNotes = `Time: ${startTime} - ${endTime}\n${location ? `Location: ${location}\n` : ''}${notes}`.trim();

      await updateTraining.mutateAsync({
        trainingId: training.id,
        training_course_id: courseId,
        staff_id: staffId,
        branch_id: branchId || training.branch_id,
        assigned_date: date,
        training_notes: trainingNotes,
        status: status
      });

      // Wait for React Query to process invalidations
      await new Promise(resolve => setTimeout(resolve, 100));

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating training:', error);
    }
  };

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  if (!training) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Training</DialogTitle>
          <DialogDescription>Update training details and schedule.</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="course">Training Course *</Label>
              <SafeSelect value={courseId} onValueChange={setCourseId}>
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
              <Label htmlFor="staff">Staff Member *</Label>
              <EnhancedStaffSelector
                branchId={branchId || training.branch_id}
                selectedStaffId={staffId}
                onStaffSelect={(id, data) => {
                  setStaffId(id);
                  setStaffData(data);
                }}
                placeholder="Search staff member"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime">End Time *</Label>
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
              <Label htmlFor="status">Status *</Label>
              <SafeSelect value={status} onValueChange={setStatus}>
                <SafeSelectTrigger>
                  <SafeSelectValue placeholder="Select status" />
                </SafeSelectTrigger>
                <SafeSelectContent>
                  <SafeSelectItem value="not-started">Not Started</SafeSelectItem>
                  <SafeSelectItem value="in-progress">In Progress</SafeSelectItem>
                  <SafeSelectItem value="completed">Completed</SafeSelectItem>
                  <SafeSelectItem value="paused">Paused</SafeSelectItem>
                  <SafeSelectItem value="expired">Expired</SafeSelectItem>
                </SafeSelectContent>
              </SafeSelect>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or requirements"
                rows={3}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateTraining}
            disabled={!courseId || !staffId || !date || !startTime || !endTime || updateTraining.isPending}
          >
            {updateTraining.isPending ? 'Updating...' : 'Update Training'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
