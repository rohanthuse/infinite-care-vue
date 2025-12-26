import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JsonGoal {
  description?: string;
  goal?: string;
  measurable_outcome?: string;
  status?: string;
  progress?: number;
  notes?: string;
}

interface JsonActivity {
  name?: string;
  description?: string;
  frequency?: string;
  status?: string;
}

interface SyncResult {
  care_plan_id: string;
  goals_synced: number;
  goals_skipped: number;
  activities_synced: number;
  activities_skipped: number;
  errors: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { care_plan_id, sync_all } = await req.json();

    console.log('[sync-care-plan-data] Starting sync', { care_plan_id, sync_all });

    const results: SyncResult[] = [];

    // Determine which care plans to sync
    let carePlansQuery = supabase
      .from('client_care_plans')
      .select('id, auto_save_data')
      .not('auto_save_data', 'is', null);

    if (care_plan_id && !sync_all) {
      carePlansQuery = carePlansQuery.eq('id', care_plan_id);
    }

    const { data: carePlans, error: fetchError } = await carePlansQuery;

    if (fetchError) {
      console.error('[sync-care-plan-data] Error fetching care plans:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch care plans', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-care-plan-data] Found ${carePlans?.length || 0} care plans to process`);

    for (const carePlan of carePlans || []) {
      const result: SyncResult = {
        care_plan_id: carePlan.id,
        goals_synced: 0,
        goals_skipped: 0,
        activities_synced: 0,
        activities_skipped: 0,
        errors: [],
      };

      const autoSave = carePlan.auto_save_data as any;

      // Sync Goals
      const jsonGoals: JsonGoal[] = autoSave?.goals || [];
      if (jsonGoals.length > 0) {
        // Fetch existing goals
        const { data: existingGoals } = await supabase
          .from('client_care_plan_goals')
          .select('description')
          .eq('care_plan_id', carePlan.id);

        const existingDescriptions = new Set(
          (existingGoals || []).map((g: any) => g.description?.toLowerCase().trim())
        );

        for (const goal of jsonGoals) {
          const goalDescription = goal.description || goal.goal || '';
          if (!goalDescription) {
            result.goals_skipped++;
            continue;
          }

          if (existingDescriptions.has(goalDescription.toLowerCase().trim())) {
            result.goals_skipped++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('client_care_plan_goals')
            .insert({
              care_plan_id: carePlan.id,
              description: goalDescription,
              status: goal.status || 'not-started',
              progress: goal.progress || 0,
              notes: goal.notes || null,
            });

          if (insertError) {
            result.errors.push(`Goal insert error: ${insertError.message}`);
          } else {
            result.goals_synced++;
            existingDescriptions.add(goalDescription.toLowerCase().trim());
          }
        }
      }

      // Sync Activities
      const jsonActivities: JsonActivity[] = autoSave?.activities || [];
      if (jsonActivities.length > 0) {
        // Fetch existing activities
        const { data: existingActivities } = await supabase
          .from('client_activities')
          .select('name')
          .eq('care_plan_id', carePlan.id);

        const existingNames = new Set(
          (existingActivities || []).map((a: any) => a.name?.toLowerCase().trim())
        );

        for (const activity of jsonActivities) {
          const activityName = activity.name || activity.description || '';
          if (!activityName) {
            result.activities_skipped++;
            continue;
          }

          if (existingNames.has(activityName.toLowerCase().trim())) {
            result.activities_skipped++;
            continue;
          }

          const { error: insertError } = await supabase
            .from('client_activities')
            .insert({
              care_plan_id: carePlan.id,
              name: activityName,
              description: activity.description || null,
              frequency: activity.frequency || 'daily',
              status: activity.status || 'active',
            });

          if (insertError) {
            result.errors.push(`Activity insert error: ${insertError.message}`);
          } else {
            result.activities_synced++;
            existingNames.add(activityName.toLowerCase().trim());
          }
        }
      }

      results.push(result);
      console.log(`[sync-care-plan-data] Processed care plan ${carePlan.id}:`, result);
    }

    const totalGoalsSynced = results.reduce((sum, r) => sum + r.goals_synced, 0);
    const totalActivitiesSynced = results.reduce((sum, r) => sum + r.activities_synced, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log('[sync-care-plan-data] Sync complete', {
      care_plans_processed: results.length,
      total_goals_synced: totalGoalsSynced,
      total_activities_synced: totalActivitiesSynced,
      total_errors: totalErrors,
    });

    return new Response(
      JSON.stringify({
        success: true,
        care_plans_processed: results.length,
        total_goals_synced: totalGoalsSynced,
        total_activities_synced: totalActivitiesSynced,
        total_errors: totalErrors,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[sync-care-plan-data] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
