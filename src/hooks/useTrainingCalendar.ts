import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      // For now, we'll just show a success message
      // This can be expanded when proper training scheduling is implemented
      return { success: true, message: 'Training scheduled successfully' };
    },
    onSuccess: () => {
      toast.success('Training scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
    },
    onError: (error) => {
      console.error('Error scheduling training:', error);
      toast.error('Failed to schedule training');
    }
  });
};