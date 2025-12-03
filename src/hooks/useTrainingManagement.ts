
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainingCourse } from "./useTrainingCourses";
import { useBranchStaff } from "./useBranchStaff";

export const useTrainingManagement = (branchId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: branchStaff } = useBranchStaff(branchId);

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>) => {
      // Create the training course
      const { data: newCourse, error: courseError } = await supabase
        .from('training_courses')
        .insert({
          ...courseData,
          branch_id: branchId
        })
        .select()
        .single();

      if (courseError) throw courseError;

      return newCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['training-courses', branchId],
        refetchType: 'active'
      });
      
      toast({
        title: "Training course created successfully!",
        description: "Use the 'Assign Training' button to assign this course to staff members.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create training course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const assignTrainingMutation = useMutation({
    mutationFn: async ({ staffIds, courseId }: { staffIds: string[], courseId: string }) => {
      const records = staffIds.map(staffId => ({
        staff_id: staffId,
        training_course_id: courseId,
        branch_id: branchId,
        status: 'not-started' as const,
        assigned_date: new Date().toISOString().split('T')[0]
      }));

      const { data, error } = await supabase
        .from('staff_training_records')
        .upsert(records, { 
          onConflict: 'staff_id,training_course_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff-training-records', branchId] });
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
      
      // Fetch the course title for notification
      try {
        const { data: course } = await supabase
          .from('training_courses')
          .select('title')
          .eq('id', variables.courseId)
          .single();
        
        // Send notification to assigned staff
        await supabase.functions.invoke('create-training-assignment-notifications', {
          body: {
            training_course_id: variables.courseId,
            training_title: course?.title || 'Training Program',
            staff_ids: variables.staffIds,
            branch_id: branchId
          }
        });
        console.log('[useTrainingManagement] Training assignment notifications sent');
      } catch (notifError) {
        console.error('[useTrainingManagement] Failed to send notifications:', notifError);
      }
      
      toast({
        title: "Training assigned",
        description: `Training assigned to ${data?.length || 0} staff members.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to assign training: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { error } = await supabase
        .from('training_courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['training-courses', branchId],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['staff-training-records', branchId],
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: ['carer-training'],
        refetchType: 'active'
      });
      toast({
        title: "Training deleted successfully!",
        description: "The training course has been removed from the system.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete training course: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    createCourse: createCourseMutation.mutate,
    assignTraining: assignTrainingMutation.mutate,
    deleteCourse: deleteCourseMutation.mutate,
    isCreating: createCourseMutation.isPending,
    isAssigning: assignTrainingMutation.isPending,
    isDeleting: deleteCourseMutation.isPending,
  };
};
