import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface JsonGoal {
  description?: string;
  measurable_outcome?: string;
  priority?: string;
  target_date?: string;
}

interface JsonActivity {
  name?: string;
  description?: string;
  duration?: string;
  frequency?: string;
  time_of_day?: string;
}

interface JsonMedication {
  name?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  prescriber?: string;
}

interface JsonTask {
  category?: string;
  name?: string;
  description?: string;
}

interface TransformedGoal {
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
}

interface TransformedActivity {
  id: string;
  care_plan_id: string;
  name: string;
  description: string | null;
  frequency: string;
  status: string;
  created_at: string;
  updated_at: string;
  duration?: string;
  time_of_day?: string;
}

interface TransformedMedication {
  id: string;
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  status: string;
}

interface TransformedTask {
  id: string;
  care_plan_id: string;
  task_category: string;
  task_name: string;
}

export const useCarePlanJsonData = (carePlanId: string) => {
  return useQuery({
    queryKey: ['care-plan-json-data', carePlanId],
    queryFn: async () => {
      if (!carePlanId) {
        return { goals: [], activities: [], medications: [], tasks: [] };
      }

      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id, auto_save_data, created_at, updated_at')
        .eq('id', carePlanId)
        .single();

      if (error) {
        console.error('[useCarePlanJsonData] Error fetching care plan:', error);
        throw error;
      }

      if (!data || !data.auto_save_data) {
        return { goals: [], activities: [], medications: [], tasks: [] };
      }

      const autoSaveData = data.auto_save_data as any;

      // Transform goals from JSON
      const goals: TransformedGoal[] = (autoSaveData.goals || []).map((goal: JsonGoal, index: number) => ({
        id: `json-goal-${index}`,
        care_plan_id: data.id,
        description: goal.description || '',
        status: 'not-started',
        progress: 0,
        notes: null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        priority: goal.priority || 'medium',
        target_date: goal.target_date || null,
        measurable_outcome: goal.measurable_outcome || null,
      }));

      // Transform activities from JSON
      const activities: TransformedActivity[] = (autoSaveData.activities || []).map((activity: JsonActivity, index: number) => ({
        id: `json-activity-${index}`,
        care_plan_id: data.id,
        name: activity.name || '',
        description: activity.description || null,
        frequency: activity.frequency || 'daily',
        status: 'active',
        created_at: data.created_at,
        updated_at: data.updated_at,
        duration: activity.duration || null,
        time_of_day: activity.time_of_day || null,
      }));

      // Transform medications from JSON (check multiple possible locations)
      const medicationsSource = autoSaveData.medications || 
        autoSaveData.medical_info?.medications || 
        [];
      const medications: TransformedMedication[] = medicationsSource.map((med: JsonMedication, index: number) => ({
        id: `json-medication-${index}`,
        care_plan_id: data.id,
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || 'daily',
        instructions: med.instructions || null,
        status: 'active',
      }));

      // Transform tasks from personal_care and activities
      const tasks: TransformedTask[] = [];
      
      // Extract from personal_care.items
      if (autoSaveData.personal_care?.items) {
        autoSaveData.personal_care.items.forEach((item: any, index: number) => {
          if (item.description || item.name) {
            tasks.push({
              id: `json-task-pc-${index}`,
              care_plan_id: data.id,
              task_category: 'Personal Care',
              task_name: item.description || item.name,
            });
          }
        });
      }

      // Extract from activities
      if (autoSaveData.activities) {
        autoSaveData.activities.forEach((act: any, index: number) => {
          if (act.name || act.description) {
            tasks.push({
              id: `json-task-act-${index}`,
              care_plan_id: data.id,
              task_category: 'Activity',
              task_name: act.name || act.description,
            });
          }
        });
      }

      console.log('[useCarePlanJsonData] Transformed goals:', goals.length);
      console.log('[useCarePlanJsonData] Transformed activities:', activities.length);
      console.log('[useCarePlanJsonData] Transformed medications:', medications.length);
      console.log('[useCarePlanJsonData] Transformed tasks:', tasks.length);

      return { goals, activities, medications, tasks };
    },
    enabled: Boolean(carePlanId),
    staleTime: 0, // Always refetch when invalidated
  });
};
