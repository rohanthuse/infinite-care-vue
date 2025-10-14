import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StaffTrainingRecord {
  id: string;
  staff_id: string;
  training_course_id: string;
  branch_id: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired' | 'paused' | 'under-review' | 'failed' | 'renewal-required';
  completion_date: string | null;
  expiry_date: string | null;
  score: number | null;
  assigned_date: string;
  assigned_by: string | null;
  progress_percentage: number | null;
  time_spent_minutes: number | null;
  last_accessed: string | null;
  notes: string | null;
  training_notes: string | null;
  reflection_notes: string | null;
  evidence_files: any[] | null;
  certificate_url: string | null;
  created_at: string;
  updated_at: string;
  training_course: {
    id: string;
    title: string;
    description: string | null;
    category: 'core' | 'mandatory' | 'specialized' | 'optional';
    valid_for_months: number | null;
    required_score: number;
    max_score: number;
    is_mandatory: boolean;
  } | null;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    branch_id: string;
  } | null;
}

export interface StaffTrainingStats {
  totalCourses: number;
  completedCount: number;
  inProgressCount: number;
  expiredCount: number;
  pendingCount: number;
  completionPercentage: number;
  mandatoryCompleted: number;
  mandatoryTotal: number;
}

export const useStaffTrainingById = (staffId: string, branchId?: string) => {
  const { data: trainingRecords = [], isLoading, error } = useQuery({
    queryKey: ['staff-training-by-id', staffId, branchId],
    queryFn: async () => {
      if (!staffId) {
        throw new Error('Staff ID is required');
      }

      let query = supabase
        .from('staff_training_records')
        .select(`
          *,
          training_course:training_courses!inner(
            id, title, description, category, valid_for_months, 
            required_score, max_score, is_mandatory
          ),
          staff:staff!inner(id, first_name, last_name, branch_id)
        `)
        .eq('staff_id', staffId);

      // Optionally filter by branch if provided
      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query.order('assigned_date', { ascending: false });

      if (error) throw error;
      return data as StaffTrainingRecord[];
    },
    enabled: !!staffId,
  });

  // Calculate stats
  const stats: StaffTrainingStats = {
    totalCourses: trainingRecords.length,
    completedCount: trainingRecords.filter(r => r.status === 'completed').length,
    inProgressCount: trainingRecords.filter(r => r.status === 'in-progress').length,
    expiredCount: trainingRecords.filter(r => r.status === 'expired').length,
    pendingCount: trainingRecords.filter(r => r.status === 'not-started').length,
    completionPercentage: trainingRecords.length > 0 
      ? Math.round((trainingRecords.filter(r => r.status === 'completed').length / trainingRecords.length) * 100)
      : 0,
    mandatoryCompleted: trainingRecords.filter(r => r.training_course?.is_mandatory && r.status === 'completed').length,
    mandatoryTotal: trainingRecords.filter(r => r.training_course?.is_mandatory).length,
  };

  return {
    trainingRecords,
    stats,
    isLoading,
    error,
  };
};
