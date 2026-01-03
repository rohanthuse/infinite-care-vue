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
  time_of_day?: string | string[];
}

interface JsonMedication {
  id?: string;
  name?: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
  instruction?: string;  // Alternative field name used in some forms
  prescriber?: string;
  time_of_day?: string[];  // For time-based filtering
  status?: string;
  route?: string;
  shape?: string;
  who_administers?: string;
  level?: string;
  warning?: string;
  side_effect?: string;
  start_date?: string;
  end_date?: string;
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
  time_of_day?: string[];
}

interface TransformedMedication {
  id: string;
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  status: string;
  time_of_day?: string[];  // For time-based filtering
  route?: string;
  shape?: string;
  who_administers?: string;
  level?: string;
  warning?: string;
  side_effect?: string;
  start_date?: string;
  end_date?: string;
  prescriber?: string;
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
      const activities: TransformedActivity[] = (autoSaveData.activities || []).map((activity: JsonActivity, index: number) => {
        // Normalize time_of_day to always be an array
        let timeOfDay: string[] | undefined = undefined;
        if (activity.time_of_day) {
          timeOfDay = Array.isArray(activity.time_of_day) ? activity.time_of_day : [activity.time_of_day];
        }
        
        return {
          id: `json-activity-${index}`,
          care_plan_id: data.id,
          name: activity.name || '',
          description: activity.description || null,
          frequency: activity.frequency || 'daily',
          status: 'active',
          created_at: data.created_at,
          updated_at: data.updated_at,
          duration: activity.duration || undefined,
          time_of_day: timeOfDay,
        };
      });

      // Transform medications from JSON (check all possible locations)
      const medicationsSource = autoSaveData.medications || 
        autoSaveData.medical_info?.medication_manager?.medications ||
        autoSaveData.medical_info?.medications || 
        [];
      const medications: TransformedMedication[] = medicationsSource.map((med: JsonMedication, index: number) => ({
        id: med.id || `json-medication-${index}`,
        care_plan_id: data.id,
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || 'daily',
        instructions: med.instructions || med.instruction || null,
        status: med.status || 'active',
        time_of_day: med.time_of_day || [],
        route: med.route || null,
        shape: med.shape || null,
        who_administers: med.who_administers || null,
        level: med.level || null,
        warning: med.warning || null,
        side_effect: med.side_effect || null,
        start_date: med.start_date || null,
        end_date: med.end_date || null,
        prescriber: med.prescriber || null,
      }));

      // Transform tasks from personal_care ONLY (not activities - those belong in Activities tab)
      const tasks: TransformedTask[] = [];
      
      // Extract from personal_care.items only
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
