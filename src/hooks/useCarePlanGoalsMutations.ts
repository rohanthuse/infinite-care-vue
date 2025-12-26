
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

interface JsonGoal {
  description?: string;
  goal?: string;
  measurable_outcome?: string;
  status?: string;
  progress?: number;
  notes?: string;
  priority?: string;
  target_date?: string;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
}

/**
 * Sync goals from care plan's auto_save_data JSON to the client_care_plan_goals table.
 * This ensures goals stored in JSON are persisted to the relational table.
 */
export const syncGoalsFromJson = async (carePlanId: string): Promise<SyncResult> => {
  console.log('[syncGoalsFromJson] Starting sync for care plan:', carePlanId);
  
  const result: SyncResult = { synced: 0, skipped: 0, errors: 0 };
  
  if (!carePlanId) {
    console.warn('[syncGoalsFromJson] No care plan ID provided');
    return result;
  }

  try {
    // Fetch the care plan with its auto_save_data
    const { data: carePlan, error: fetchError } = await supabase
      .from('client_care_plans')
      .select('id, auto_save_data')
      .eq('id', carePlanId)
      .single();

    if (fetchError || !carePlan) {
      console.error('[syncGoalsFromJson] Error fetching care plan:', fetchError);
      result.errors++;
      return result;
    }

    const autoSave = carePlan.auto_save_data as any;
    const jsonGoals: JsonGoal[] = autoSave?.goals || [];

    if (jsonGoals.length === 0) {
      console.log('[syncGoalsFromJson] No goals in JSON to sync');
      return result;
    }

    // Fetch existing goals to avoid duplicates
    const { data: existingGoals } = await supabase
      .from('client_care_plan_goals')
      .select('description')
      .eq('care_plan_id', carePlanId);

    const existingDescriptions = new Set((existingGoals || []).map(g => g.description?.toLowerCase().trim()));

    // Insert new goals that don't exist yet
    for (const goal of jsonGoals) {
      const goalDescription = goal.description || goal.goal || '';
      
      if (!goalDescription) {
        result.skipped++;
        continue;
      }

      // Check if goal already exists (by description)
      if (existingDescriptions.has(goalDescription.toLowerCase().trim())) {
        console.log('[syncGoalsFromJson] Goal already exists, skipping:', goalDescription);
        result.skipped++;
        continue;
      }

      // Insert new goal
      const { error: insertError } = await supabase
        .from('client_care_plan_goals')
        .insert({
          care_plan_id: carePlanId,
          description: goalDescription,
          status: goal.status || 'not-started',
          progress: goal.progress || 0,
          notes: goal.notes || null,
        });

      if (insertError) {
        console.error('[syncGoalsFromJson] Error inserting goal:', insertError);
        result.errors++;
      } else {
        console.log('[syncGoalsFromJson] Synced goal:', goalDescription);
        result.synced++;
        existingDescriptions.add(goalDescription.toLowerCase().trim());
      }
    }

    console.log('[syncGoalsFromJson] Sync complete:', result);
    return result;
  } catch (error) {
    console.error('[syncGoalsFromJson] Unexpected error:', error);
    result.errors++;
    return result;
  }
};

/**
 * Hook to use the sync function with query invalidation
 */
export const useSyncGoalsFromJson = () => {
  const queryClient = useQueryClient();

  return async (carePlanId: string): Promise<SyncResult> => {
    const result = await syncGoalsFromJson(carePlanId);
    
    if (result.synced > 0) {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', carePlanId] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    }

    return result;
  };
};

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
      console.log('[useCreateGoal] SUCCESS - Invalidating queries for care plan:', data.care_plan_id);
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-json-data', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
    onError: (error) => {
      console.error('[useCreateGoal] MUTATION ERROR:', error);
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateGoal,
    onSuccess: (data) => {
      console.log('[useUpdateGoal] SUCCESS - Invalidating queries for care plan:', data.care_plan_id);
      queryClient.invalidateQueries({ queryKey: ['care-plan-goals', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-json-data', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
    onError: (error) => {
      console.error('[useUpdateGoal] MUTATION ERROR:', error);
    },
  });
};
