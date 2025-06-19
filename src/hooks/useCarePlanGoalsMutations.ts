
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreateGoalParams {
  care_plan_id: string;
  description: string;
  status?: string;
  progress?: number;
  notes?: string;
}

interface UpdateGoalParams {
  goalId: string;
  updates: {
    description?: string;
    status?: string;
    progress?: number;
    notes?: string;
  };
}

const createGoal = async (params: CreateGoalParams) => {
  console.log('[createGoal] Creating goal:', params);
  
  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .insert({
      care_plan_id: params.care_plan_id,
      description: params.description,
      status: params.status || 'not-started',
      progress: params.progress || 0,
      notes: params.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[createGoal] Error:', error);
    throw error;
  }

  return data;
};

const updateGoal = async ({ goalId, updates }: UpdateGoalParams) => {
  console.log('[updateGoal] Updating goal:', goalId, updates);
  
  const { data, error } = await supabase
    .from('client_care_plan_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();

  if (error) {
    console.error('[updateGoal] Error:', error);
    throw error;
  }

  return data;
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createGoal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateGoal,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
  });
};
