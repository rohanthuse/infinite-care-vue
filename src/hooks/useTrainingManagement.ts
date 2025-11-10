
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
      // First, create the training course
      const { data: newCourse, error: courseError } = await supabase
        .from('training_courses')
        .insert({
          ...courseData,
          branch_id: branchId
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Then, automatically assign it to all active staff in the branch
      if (branchStaff && branchStaff.length > 0) {
        const trainingRecords = branchStaff.map(staff => ({
          staff_id: staff.id,
          training_course_id: newCourse.id,
          branch_id: branchId,
          status: 'not-started' as const,
          assigned_date: new Date().toISOString().split('T')[0]
        }));

        const { error: assignmentError } = await supabase
          .from('staff_training_records')
          .insert(trainingRecords);

        if (assignmentError) {
          console.warn('Failed to auto-assign training to staff:', assignmentError);
          // Don't throw here - course was created successfully
        }
      }

      return newCourse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-courses', branchId] });
      queryClient.invalidateQueries({ queryKey: ['staff-training-records', branchId] });
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
      
      const staffCount = branchStaff?.length || 0;
      toast({
        title: "Training course created",
        description: `New training course has been created and assigned to ${staffCount} staff members.`,
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-training-records', branchId] });
      queryClient.invalidateQueries({ queryKey: ['carer-training'] });
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
