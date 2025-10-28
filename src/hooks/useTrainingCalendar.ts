import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduleTraining {
  training_course_id: string;
  staff_id: string;
  branch_id: string;
  scheduled_date: string; // Will be mapped to assigned_date in DB
  notes?: string; // Will be mapped to training_notes in DB
}

export const useScheduleTraining = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (training: ScheduleTraining) => {
      console.log('Scheduling training:', training);
      
      const { data, error } = await supabase
        .from('staff_training_records')
        .insert([{
          training_course_id: training.training_course_id,
          staff_id: training.staff_id,
          branch_id: training.branch_id,
          assigned_date: training.scheduled_date, // Map scheduled_date to assigned_date
          training_notes: training.notes, // Map notes to training_notes
          status: 'not-started' // Default status for newly scheduled training
        }])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Training scheduled successfully:', data);
      return data?.[0] || data;
    },
    onSuccess: (data) => {
      console.log('Training scheduling successful:', data);
      toast.success('Training scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
      queryClient.invalidateQueries({ queryKey: ['staff-training'] });
    },
    onError: (error) => {
      console.error('Error scheduling training:', error);
      toast.error(`Failed to schedule training: ${error.message}`);
    }
  });
};