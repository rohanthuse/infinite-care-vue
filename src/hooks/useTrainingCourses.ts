
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingCourse {
  id: string;
  title: string;
  description: string | null;
  category: 'core' | 'mandatory' | 'specialized' | 'optional';
  valid_for_months: number | null;
  required_score: number;
  max_score: number;
  branch_id: string | null;
  is_mandatory: boolean;
  certificate_template: string | null;
  created_at: string;
  updated_at: string;
  status: 'active' | 'inactive' | 'archived';
}

export const useTrainingCourses = (branchId: string) => {
  return useQuery({
    queryKey: ['training-courses', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('category', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;
      return data as TrainingCourse[];
    },
  });
};
