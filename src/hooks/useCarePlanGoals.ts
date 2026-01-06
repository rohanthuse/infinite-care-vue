
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CarePlanGoal {
  id: string;
  care_plan_id: string;
  description: string;
  status: string;
  progress?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  priority?: string;
  target_date?: string;
  measurable_outcome?: string;
  time_of_day?: string[];
}

const fetchCarePlanGoals = async (carePlanId: string): Promise<CarePlanGoal[]> => {
  console.log('[useCarePlanGoals] Fetching goals for care plan:', carePlanId);
  
  if (!carePlanId) {
    console.log('[useCarePlanGoals] No care plan ID provided');
    return [];
  }

  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useCarePlanGoals] Error fetching care plan goals:', error);
    throw error;
  }

  console.log('[useCarePlanGoals] Successfully fetched goals:', data?.length || 0, 'goals');
  return data || [];
};

export const useCarePlanGoals = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-goals', carePlanId],
    queryFn: () => fetchCarePlanGoals(carePlanId),
    enabled: Boolean(carePlanId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Update a care plan goal (status, progress, notes)
export const useUpdateCarePlanGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { 
      id: string; 
      updates: Partial<{ status: string; progress: number; notes: string }> 
    }) => {
      console.log('[useUpdateCarePlanGoal] Updating goal:', id, updates);
      
      const { data, error } = await supabase
        .from('client_care_plan_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateCarePlanGoal] Error:', error);
        throw error;
      }
      
      console.log('[useUpdateCarePlanGoal] Updated successfully:', data);
      return data;
    },
    onSuccess: (data) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-json-data'] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
    onError: (error) => {
      console.error('[useUpdateCarePlanGoal] Mutation error:', error);
      toast.error('Failed to update goal');
    },
  });
};
