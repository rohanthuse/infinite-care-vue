import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ScheduleTraining {
  training_course_id: string;
  staff_id: string;
  branch_id: string;
  scheduled_date: string;
  scheduled_time?: string;
  end_time?: string;
  location?: string;
  notes?: string;
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
          scheduled_date: training.scheduled_date,
          scheduled_time: training.scheduled_time,
          end_time: training.end_time,
          location: training.location,
          notes: training.notes,
          status: 'scheduled'
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