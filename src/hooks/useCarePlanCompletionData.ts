import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanCompletionData {
  id: string;
  client_id: string;
  client_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  review_date?: string;
  is_overdue: boolean;
  days_overdue?: number;
  total_goals: number;
  completed_goals: number;
  in_progress_goals: number;
  not_started_goals: number;
  goals_completion_rate: number;
  approval_status?: string;
  approved_at?: string;
  rejected_at?: string;
  client_signature?: string;
  staff_assigned?: string;
}

export interface CarePlanStats {
  total_care_plans: number;
  active_plans: number;
  pending_approval: number;
  rejected_plans: number;
  overdue_reviews: number;
  avg_goals_completion: number;
  plans_with_no_goals: number;
}

const fetchCarePlanCompletionData = async (branchId: string): Promise<{
  carePlans: CarePlanCompletionData[];
  stats: CarePlanStats;
}> => {
  console.log('[useCarePlanCompletionData] Fetching care plan data for branch:', branchId);

  // Fetch all care plans with client info
  const { data: carePlans, error: carePlansError } = await supabase
    .from('client_care_plans')
    .select(`
      id,
      client_id,
      status,
      created_at,
      updated_at,
      review_date,
      clients!inner (
        id,
        full_name,
        branch_id
      )
    `)
    .eq('clients.branch_id', branchId)
    .order('updated_at', { ascending: false });

  if (carePlansError) {
    console.error('[useCarePlanCompletionData] Error fetching care plans:', carePlansError);
    throw carePlansError;
  }

  // Fetch all goals for these care plans
  const carePlanIds = carePlans?.map(cp => cp.id) || [];
  const { data: goals, error: goalsError } = await supabase
    .from('client_care_plan_goals')
    .select('care_plan_id, status')
    .in('care_plan_id', carePlanIds);

  if (goalsError) {
    console.error('[useCarePlanCompletionData] Error fetching goals:', goalsError);
    throw goalsError;
  }

  // Process data
  const today = new Date();
  const processedCarePlans: CarePlanCompletionData[] = (carePlans || []).map(cp => {
    const carePlanGoals = goals?.filter(g => g.care_plan_id === cp.id) || [];
    const totalGoals = carePlanGoals.length;
    const completedGoals = carePlanGoals.filter(g => g.status === 'completed').length;
    const inProgressGoals = carePlanGoals.filter(g => g.status === 'in-progress').length;
    const notStartedGoals = carePlanGoals.filter(g => g.status === 'not-started').length;
    
    const goalsCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

    // Check if review is overdue
    const reviewDate = cp.review_date ? new Date(cp.review_date) : null;
    const isOverdue = reviewDate ? reviewDate < today : false;
    const daysOverdue = isOverdue && reviewDate 
      ? Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24))
      : undefined;

    return {
      id: cp.id,
      client_id: cp.client_id,
      client_name: (cp.clients as any)?.full_name || 'Unknown',
      status: cp.status,
      created_at: cp.created_at,
      updated_at: cp.updated_at,
      review_date: cp.review_date,
      is_overdue: isOverdue,
      days_overdue: daysOverdue,
      total_goals: totalGoals,
      completed_goals: completedGoals,
      in_progress_goals: inProgressGoals,
      not_started_goals: notStartedGoals,
      goals_completion_rate: Math.round(goalsCompletionRate),
    };
  });

  // Calculate stats
  const stats: CarePlanStats = {
    total_care_plans: processedCarePlans.length,
    active_plans: processedCarePlans.filter(cp => cp.status === 'active').length,
    pending_approval: processedCarePlans.filter(cp => 
      cp.status === 'pending-client-approval' || cp.status === 'draft'
    ).length,
    rejected_plans: processedCarePlans.filter(cp => cp.status === 'rejected').length,
    overdue_reviews: processedCarePlans.filter(cp => cp.is_overdue).length,
    avg_goals_completion: processedCarePlans.length > 0
      ? Math.round(
          processedCarePlans.reduce((sum, cp) => sum + cp.goals_completion_rate, 0) / 
          processedCarePlans.length
        )
      : 0,
    plans_with_no_goals: processedCarePlans.filter(cp => cp.total_goals === 0).length,
  };

  console.log('[useCarePlanCompletionData] Processed data:', {
    carePlansCount: processedCarePlans.length,
    stats,
  });

  return { carePlans: processedCarePlans, stats };
};

export const useCarePlanCompletionData = (branchId: string) => {
  return useQuery({
    queryKey: ['care-plan-completion-data', branchId],
    queryFn: () => fetchCarePlanCompletionData(branchId),
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
