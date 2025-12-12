import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanSummaryGoal {
  id: string;
  description: string;
  status: string;
  progress: number | null;
  notes: string | null;
}

export interface CarePlanSummaryActivity {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  status: string;
}

export interface CarePlanSummaryMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: string;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
}

export interface CarePlanSummaryTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  notes: string | null;
  category: string | null;
}

export interface CarePlanSummary {
  carePlan: {
    id: string;
    title: string;
    status: string;
    display_id: string;
  } | null;
  goals: { total: number; completed: number; items: CarePlanSummaryGoal[] };
  activities: { total: number; active: number; items: CarePlanSummaryActivity[] };
  medications: { total: number; active: number; items: CarePlanSummaryMedication[] };
  tasks: { total: number; pending: number; items: CarePlanSummaryTask[] };
  isLoading: boolean;
  hasCarePlan: boolean;
}

const fetchCarePlanSummary = async (clientId: string): Promise<Omit<CarePlanSummary, 'isLoading'>> => {
  console.log('[useClientCarePlanSummary] Fetching care plan summary for client:', clientId);

  if (!clientId) {
    return {
      carePlan: null,
      goals: { total: 0, completed: 0, items: [] },
      activities: { total: 0, active: 0, items: [] },
      medications: { total: 0, active: 0, items: [] },
      tasks: { total: 0, pending: 0, items: [] },
      hasCarePlan: false,
    };
  }

  // Fetch active care plan for client including auto_save_data
  const { data: carePlan, error: carePlanError } = await supabase
    .from('client_care_plans')
    .select('id, title, status, display_id, auto_save_data')
    .eq('client_id', clientId)
    .in('status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (carePlanError) {
    console.error('[useClientCarePlanSummary] Error fetching care plan:', carePlanError);
  }

  if (!carePlan) {
    console.log('[useClientCarePlanSummary] No active care plan found for client');
    return {
      carePlan: null,
      goals: { total: 0, completed: 0, items: [] },
      activities: { total: 0, active: 0, items: [] },
      medications: { total: 0, active: 0, items: [] },
      tasks: { total: 0, pending: 0, items: [] },
      hasCarePlan: false,
    };
  }

  // Parse auto_save_data JSON for goals, activities, and medications
  const autoSaveData = carePlan.auto_save_data as Record<string, any> | null;
  
  // Extract goals from auto_save_data
  const jsonGoals = autoSaveData?.goals || [];
  const parsedGoals: CarePlanSummaryGoal[] = Array.isArray(jsonGoals) 
    ? jsonGoals.map((g: any, index: number) => ({
        id: `goal-${index}`,
        description: g.description || g.goal || '',
        status: g.status || 'in_progress',
        progress: g.progress || null,
        notes: g.measurable_outcome || g.notes || null,
      }))
    : [];

  // Extract activities from auto_save_data
  const jsonActivities = autoSaveData?.activities || [];
  const parsedActivities: CarePlanSummaryActivity[] = Array.isArray(jsonActivities)
    ? jsonActivities.map((a: any, index: number) => ({
        id: `activity-${index}`,
        name: a.name || a.activity || '',
        description: a.description || null,
        frequency: a.frequency || '',
        status: a.status || 'active',
      }))
    : [];

  // Extract medications from auto_save_data (medical_info.medication_manager.medications)
  const jsonMedications = autoSaveData?.medical_info?.medication_manager?.medications || [];
  const parsedMedications: CarePlanSummaryMedication[] = Array.isArray(jsonMedications)
    ? jsonMedications.map((m: any) => ({
        id: m.id || `med-${Date.now()}-${Math.random()}`,
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        status: m.status || 'active',
        notes: m.instruction || m.notes || null,
        start_date: m.start_date || null,
        end_date: m.end_date || null,
      }))
    : [];

  // Fetch tasks from tasks table (tasks are stored separately)
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority, due_date, notes, category')
    .eq('client_id', clientId)
    .in('status', ['pending', 'in_progress', 'todo'])
    .order('due_date', { ascending: true })
    .limit(10);

  const tasks = tasksData || [];

  const completedGoals = parsedGoals.filter(g => g.status === 'completed').length;
  const activeActivities = parsedActivities.filter(a => a.status === 'active').length;
  const activeMedications = parsedMedications.filter(m => m.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length;

  console.log('[useClientCarePlanSummary] Summary from auto_save_data:', {
    carePlanId: carePlan.id,
    goals: parsedGoals.length,
    activities: parsedActivities.length,
    medications: parsedMedications.length,
    tasks: tasks.length,
    autoSaveDataKeys: autoSaveData ? Object.keys(autoSaveData) : [],
  });

  return {
    carePlan: { id: carePlan.id, title: carePlan.title, status: carePlan.status, display_id: carePlan.display_id },
    goals: { total: parsedGoals.length, completed: completedGoals, items: parsedGoals },
    activities: { total: parsedActivities.length, active: activeActivities, items: parsedActivities },
    medications: { total: parsedMedications.length, active: activeMedications, items: parsedMedications },
    tasks: { total: tasks.length, pending: pendingTasks, items: tasks },
    hasCarePlan: true,
  };
};

export const useClientCarePlanSummary = (clientId: string): CarePlanSummary => {
  const { data, isLoading } = useQuery({
    queryKey: ['client-care-plan-summary', clientId],
    queryFn: () => fetchCarePlanSummary(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    carePlan: data?.carePlan ?? null,
    goals: data?.goals ?? { total: 0, completed: 0, items: [] },
    activities: data?.activities ?? { total: 0, active: 0, items: [] },
    medications: data?.medications ?? { total: 0, active: 0, items: [] },
    tasks: data?.tasks ?? { total: 0, pending: 0, items: [] },
    hasCarePlan: data?.hasCarePlan ?? false,
    isLoading,
  };
};
