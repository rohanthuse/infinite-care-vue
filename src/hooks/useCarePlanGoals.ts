
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveCarePlanId } from '@/utils/carePlanIdMapping';

export interface CarePlanGoal {
  id: string;
  care_plan_id: string;
  description: string;
  status: string;
  progress?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const fetchCarePlanGoals = async (carePlanId: string): Promise<CarePlanGoal[]> => {
  console.log('[fetchCarePlanGoals] Fetching goals for care plan:', carePlanId);
  
  // Resolve the care plan ID (handles CP-001 -> UUID mapping)
  const resolvedId = resolveCarePlanId(carePlanId);
  
  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', resolvedId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchCarePlanGoals] Error:', error);
    throw error;
  }
  
  console.log('[fetchCarePlanGoals] Fetched goals:', data);
  return data || [];
};

export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: () => fetchCarePlanGoals(carePlanId),
    enabled: Boolean(carePlanId),
  });
};
