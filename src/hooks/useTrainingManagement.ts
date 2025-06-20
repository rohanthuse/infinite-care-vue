
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TrainingCourse } from "./useTrainingCourses";

export const useTrainingManagement = (branchId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('training_courses')
        .insert({
          ...courseData,
          branch_id: branchId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-courses', branchId] });
      toast({
        title: "Training course created",
        description: "New training course has been created successfully.",
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

  return {
    createCourse: createCourseMutation.mutate,
    assignTraining: assignTrainingMutation.mutate,
    isCreating: createCourseMutation.isPending,
    isAssigning: assignTrainingMutation.isPending,
  };
};
