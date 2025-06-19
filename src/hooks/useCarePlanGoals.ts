
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanGoal {
  id: string;
  care_plan_id: string;
  description: string;
  status: string;
  progress: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const fetchCarePlanGoals = async (carePlanId: string): Promise<CarePlanGoal[]> => {
  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: () => fetchCarePlanGoals(carePlanId),
    enabled: Boolean(carePlanId),
  });
};
