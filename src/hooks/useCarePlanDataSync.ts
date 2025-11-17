import { useCreateGoal } from './useCarePlanGoalsMutations';
import { useCreateClientActivity } from './useClientActivities';

interface SyncGoalParams {
  goal: any;
  care_plan_id: string;
  updates: {
    description?: string;
    status?: string;
    progress?: number;
    notes?: string;
  };
}

interface SyncActivityParams {
  activity: any;
  care_plan_id: string;
  updates: {
    name?: string;
    description?: string;
    frequency?: string;
    status?: string;
  };
}

export const useSyncGoalToDatabase = () => {
  const createGoal = useCreateGoal();

  return async ({ goal, care_plan_id, updates }: SyncGoalParams): Promise<string> => {
    // Check if this is a JSON-sourced goal (not yet in database)
    if (goal.id.startsWith('json-')) {
      console.log('[useSyncGoalToDatabase] Syncing JSON goal to database:', goal.id);
      
      // Create in database for the first time
      const newGoal = await createGoal.mutateAsync({
        care_plan_id,
        description: goal.description,
        status: updates.status || goal.status || 'not-started',
        progress: updates.progress ?? goal.progress ?? 0,
        notes: updates.notes || goal.notes || null,
      });
      
      console.log('[useSyncGoalToDatabase] Created goal in database:', newGoal.id);
      return newGoal.id;
    }
    
    // Already in database, return existing ID
    return goal.id;
  };
};

export const useSyncActivityToDatabase = () => {
  const createActivity = useCreateClientActivity();

  return async ({ activity, care_plan_id, updates }: SyncActivityParams): Promise<string> => {
    // Check if this is a JSON-sourced activity (not yet in database)
    if (activity.id.startsWith('json-')) {
      console.log('[useSyncActivityToDatabase] Syncing JSON activity to database:', activity.id);
      
      // Create in database for the first time
      const newActivity = await createActivity.mutateAsync({
        care_plan_id,
        name: activity.name,
        description: activity.description || null,
        frequency: updates.frequency || activity.frequency || 'daily',
        status: updates.status || activity.status || 'active',
      });
      
      console.log('[useSyncActivityToDatabase] Created activity in database:', newActivity.id);
      return newActivity.id;
    }
    
    // Already in database, return existing ID
    return activity.id;
  };
};
