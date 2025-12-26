import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface JsonActivity {
  name?: string;
  description?: string;
  duration?: string | number;
  frequency?: string;
  time_of_day?: string;
  status?: string;
}

interface SyncResult {
  synced: number;
  skipped: number;
  errors: number;
}

/**
 * Sync activities from care plan's auto_save_data JSON to the client_activities table.
 * This ensures activities stored in JSON are persisted to the relational table.
 */
export const syncActivitiesFromJson = async (carePlanId: string): Promise<SyncResult> => {
  console.log('[syncActivitiesFromJson] Starting sync for care plan:', carePlanId);
  
  const result: SyncResult = { synced: 0, skipped: 0, errors: 0 };
  
  if (!carePlanId) {
    console.warn('[syncActivitiesFromJson] No care plan ID provided');
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
      console.error('[syncActivitiesFromJson] Error fetching care plan:', fetchError);
      result.errors++;
      return result;
    }

    const autoSave = carePlan.auto_save_data as any;
    const jsonActivities: JsonActivity[] = autoSave?.activities || [];

    if (jsonActivities.length === 0) {
      console.log('[syncActivitiesFromJson] No activities in JSON to sync');
      return result;
    }

    // Fetch existing activities to avoid duplicates
    const { data: existingActivities } = await supabase
      .from('client_activities')
      .select('name')
      .eq('care_plan_id', carePlanId);

    const existingNames = new Set((existingActivities || []).map(a => a.name?.toLowerCase().trim()));

    // Insert new activities that don't exist yet
    for (const activity of jsonActivities) {
      const activityName = activity.name || activity.description || '';
      
      if (!activityName) {
        result.skipped++;
        continue;
      }

      // Check if activity already exists (by name)
      if (existingNames.has(activityName.toLowerCase().trim())) {
        console.log('[syncActivitiesFromJson] Activity already exists, skipping:', activityName);
        result.skipped++;
        continue;
      }

      // Insert new activity
      const { error: insertError } = await supabase
        .from('client_activities')
        .insert({
          care_plan_id: carePlanId,
          name: activityName,
          description: activity.description || null,
          frequency: activity.frequency || 'daily',
          status: activity.status || 'active',
        });

      if (insertError) {
        console.error('[syncActivitiesFromJson] Error inserting activity:', insertError);
        result.errors++;
      } else {
        console.log('[syncActivitiesFromJson] Synced activity:', activityName);
        result.synced++;
        existingNames.add(activityName.toLowerCase().trim());
      }
    }

    console.log('[syncActivitiesFromJson] Sync complete:', result);
    return result;
  } catch (error) {
    console.error('[syncActivitiesFromJson] Unexpected error:', error);
    result.errors++;
    return result;
  }
};

/**
 * Hook to use the sync function with query invalidation
 */
export const useSyncActivitiesFromJson = () => {
  const queryClient = useQueryClient();

  return async (carePlanId: string): Promise<SyncResult> => {
    const result = await syncActivitiesFromJson(carePlanId);
    
    if (result.synced > 0) {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['client-activities', carePlanId] });
      queryClient.invalidateQueries({ queryKey: ['client-activities'] });
    }

    return result;
  };
};
