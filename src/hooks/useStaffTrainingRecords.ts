
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StaffTrainingRecord {
  id: string;
  staff_id: string;
  training_course_id: string;
  branch_id: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  completion_date: string | null;
  expiry_date: string | null;
  score: number | null;
  certificate_url: string | null;
  notes: string | null;
  assigned_date: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    specialization: string | null;
  };
  training_course: {
    id: string;
    title: string;
    category: string;
    max_score: number;
  };
}

export const useStaffTrainingRecords = (branchId: string) => {
  const { toast } = useToast();

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ['staff-training-records', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_training_records')
        .select(`
          *,
          staff:staff(id, first_name, last_name, specialization),
          training_course:training_courses(id, title, category, max_score)
        `)
        .eq('branch_id', branchId)
        .order('staff_id', { ascending: true });

      if (error) throw error;
      return data as StaffTrainingRecord[];
    },
  });

  const queryClient = useQueryClient();

  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<StaffTrainingRecord> & { id: string }) => {
      const { data, error } = await supabase
        .from('staff_training_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-training-records', branchId] });
      toast({
        title: "Training record updated",
        description: "Training record has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update training record: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    records,
    isLoading,
    error,
    updateRecord: updateRecordMutation.mutate,
    isUpdating: updateRecordMutation.isPending,
  };
};
