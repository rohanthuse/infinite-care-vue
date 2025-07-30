
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerProfile } from "@/hooks/useCarerProfile";
import { toast } from "sonner";

export const useCarerTrainingActions = () => {
  const { data: carerProfile } = useCarerProfile();
  const queryClient = useQueryClient();

  const updateTrainingStatus = useMutation({
    mutationFn: async ({ 
      recordId, 
      status, 
      score,
      progress_percentage,
      time_spent_minutes,
      training_notes,
      reflection_notes
    }: { 
      recordId: string; 
      status: 'in-progress' | 'completed' | 'paused' | 'under-review' | 'failed' | 'renewal-required'; 
      score?: number;
      progress_percentage?: number;
      time_spent_minutes?: number;
      training_notes?: string;
      reflection_notes?: string;
    }) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (progress_percentage !== undefined) {
        updateData.progress_percentage = progress_percentage;
      }
      
      if (time_spent_minutes !== undefined) {
        updateData.time_spent_minutes = time_spent_minutes;
      }
      
      if (training_notes !== undefined) {
        updateData.training_notes = training_notes;
      }
      
      if (reflection_notes !== undefined) {
        updateData.reflection_notes = reflection_notes;
      }

      if (status === 'completed') {
        updateData.completion_date = new Date().toISOString().split('T')[0];
        if (score !== undefined) {
          updateData.score = score;
        }
        
        // Calculate expiry date if the course has a validity period
        const { data: courseData } = await supabase
          .from('staff_training_records')
          .select('training_course:training_courses(valid_for_months)')
          .eq('id', recordId)
          .single();

        if (courseData?.training_course?.valid_for_months) {
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + courseData.training_course.valid_for_months);
          updateData.expiry_date = expiryDate.toISOString().split('T')[0];
        }
      }

      const { data, error } = await supabase
        .from('staff_training_records')
        .update(updateData)
        .eq('id', recordId)
        .eq('staff_id', carerProfile.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
      
      if (variables.status === 'completed') {
        toast.success('Training completed successfully!');
      } else {
        toast.success('Training status updated');
      }
    },
    onError: (error: Error) => {
      toast.error('Failed to update training status', {
        description: error.message
      });
    },
  });

  const enrollInTraining = useMutation({
    mutationFn: async (courseId: string) => {
      if (!carerProfile?.id || !carerProfile?.branch_id) {
        throw new Error('Carer profile not found');
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('staff_training_records')
        .select('id')
        .eq('staff_id', carerProfile.id)
        .eq('training_course_id', courseId)
        .single();

      if (existing) {
        throw new Error('Already enrolled in this training course');
      }

      const { data, error } = await supabase
        .from('staff_training_records')
        .insert({
          staff_id: carerProfile.id,
          training_course_id: courseId,
          branch_id: carerProfile.branch_id,
          status: 'not-started',
          assigned_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
      toast.success('Successfully enrolled in training course');
    },
    onError: (error: Error) => {
      toast.error('Failed to enroll in training', {
        description: error.message
      });
    },
  });

  return {
    updateTrainingStatus,
    enrollInTraining,
    isUpdating: updateTrainingStatus.isPending,
    isEnrolling: enrollInTraining.isPending,
  };
};
