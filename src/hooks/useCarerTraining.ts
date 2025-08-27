
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerProfile } from "@/hooks/useCarerProfile";

export interface CarerTrainingRecord {
  id: string;
  training_course_id: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired' | 'paused' | 'under-review' | 'failed' | 'renewal-required';
  completion_date: string | null;
  expiry_date: string | null;
  score: number | null;
  assigned_date: string;
  progress_percentage?: number | null;
  time_spent_minutes?: number | null;
  last_accessed?: string | null;
  training_notes?: string | null;
  reflection_notes?: string | null;
  evidence_files?: any[] | null;
  retake_count?: number | null;
  renewal_requested_at?: string | null;
  supervisor_comments?: string | null;
  competency_assessment?: any | null;
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
}

export interface CarerTrainingStats {
  totalCourses: number;
  completedCount: number;
  inProgressCount: number;
  expiredCount: number;
  pendingCount: number;
  completionPercentage: number;
  mandatoryCompleted: number;
  mandatoryTotal: number;
}

export const useCarerTraining = () => {
  const { data: carerProfile } = useCarerProfile();

  const { data: trainingRecords = [], isLoading, error } = useQuery({
    queryKey: ['carer-training', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id || !carerProfile?.branch_id) {
        throw new Error('Carer profile not found');
      }

      const { data, error } = await supabase
        .from('staff_training_records')
        .select(`
          *,
          training_course:training_courses!inner(
            id, title, description, category, valid_for_months, 
            required_score, max_score, is_mandatory
          )
        `)
        .eq('staff_id', carerProfile.id)
        .eq('branch_id', carerProfile.branch_id)
        .order('assigned_date', { ascending: false });

      if (error) throw error;
      return data as CarerTrainingRecord[];
    },
    enabled: !!carerProfile?.id && !!carerProfile?.branch_id,
  });

  const stats: CarerTrainingStats = {
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
