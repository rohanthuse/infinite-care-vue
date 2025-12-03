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
    onSuccess: async (data, variables) => {
      console.log('✅ Training scheduling successful:', data);
      
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      await queryClient.invalidateQueries({ queryKey: ['staff-training'] });
      
      // CRITICAL: Force immediate refetch to ensure calendar updates
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Also invalidate stats queries
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after training creation');
      
      // Send notification to the assigned staff member
      try {
        const { data: course } = await supabase
          .from('training_courses')
          .select('title')
          .eq('id', variables.training_course_id)
          .single();
        
        await supabase.functions.invoke('create-training-assignment-notifications', {
          body: {
            training_course_id: variables.training_course_id,
            training_title: course?.title || 'Training Program',
            staff_ids: [variables.staff_id],
            branch_id: variables.branch_id
          }
        });
        console.log('✅ Training assignment notification sent');
      } catch (notifError) {
        console.error('Failed to send training notification:', notifError);
      }
      
      toast.success(
        `Training scheduled for ${variables.scheduled_date}`,
        {
          description: 'View it in the organization calendar',
        }
      );
    },
    onError: (error) => {
      console.error('Error scheduling training:', error);
      toast.error(`Failed to schedule training: ${error.message}`);
    }
  });
};

export interface UpdateTrainingParams {
  trainingId: string;
  training_course_id?: string;
  staff_id?: string;
  branch_id?: string;
  assigned_date?: string;
  training_notes?: string;
  status?: string;
}

export const useUpdateTraining = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ trainingId, ...updates }: UpdateTrainingParams) => {
      console.log('Updating training:', trainingId, updates);
      
      const { data, error } = await supabase
        .from('staff_training_records')
        .update(updates)
        .eq('id', trainingId)
        .select();
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Training updated successfully:', data);
      return data?.[0] || data;
    },
    onSuccess: async () => {
      console.log('✅ Training update successful');
      
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      await queryClient.invalidateQueries({ queryKey: ['staff-training'] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      toast.success('Training updated successfully');
    },
    onError: (error) => {
      console.error('Error updating training:', error);
      toast.error(`Failed to update training: ${error.message}`);
    }
  });
};

export const useDeleteTraining = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (trainingId: string) => {
      console.log('Deleting training:', trainingId);
      
      const { error } = await supabase
        .from('staff_training_records')
        .delete()
        .eq('id', trainingId);
      
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Training deleted successfully');
    },
    onSuccess: async () => {
      console.log('✅ Training deletion successful');
      
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      await queryClient.invalidateQueries({ queryKey: ['staff-training'] });
      
      // Force immediate refetch
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      toast.success('Training deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting training:', error);
      toast.error(`Failed to delete training: ${error.message}`);
    }
  });
};