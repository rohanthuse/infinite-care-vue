import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanSummaryGoal {
  id: string;
  description: string;
  status: string;
  progress: number | null;
  notes: string | null;
  time_of_day?: string[] | null;
}

export interface CarePlanSummaryActivity {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  status: string;
  time_of_day?: string[] | null;
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
  time_of_day?: string[] | null;
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

  // Parse auto_save_data JSON for fallback
  const autoSaveData = carePlan.auto_save_data as Record<string, any> | null;

  // Query database tables (PRIMARY SOURCE) with JSON fallback
  const [dbMedicationsResult, dbActivitiesResult, dbGoalsResult, tasksResult] = await Promise.all([
    supabase
      .from('client_medications')
      .select('*')
      .eq('care_plan_id', carePlan.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('client_activities')
      .select('*')
      .eq('care_plan_id', carePlan.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('client_care_plan_goals')
      .select('*')
      .eq('care_plan_id', carePlan.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, notes, category')
      .eq('client_id', clientId)
      .in('status', ['pending', 'in_progress', 'todo'])
      .order('due_date', { ascending: true })
      .limit(10),
  ]);

  const dbMedications = dbMedicationsResult.data || [];
  const dbActivities = dbActivitiesResult.data || [];
  const dbGoals = dbGoalsResult.data || [];
  const tasks = tasksResult.data || [];

  // MEDICATIONS: Merge database records with any unsaved JSON medications
  let parsedMedications: CarePlanSummaryMedication[] = [];
  
  // First, add all database medications
  if (dbMedications.length > 0) {
    parsedMedications = dbMedications.map((m) => ({
      id: m.id,
      name: m.name || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      status: m.status || 'active',
      notes: m.instruction || m.notes || null,
      start_date: m.start_date || null,
      end_date: m.end_date || null,
      time_of_day: m.time_of_day || null,
    }));
  }
  
  // Then, add any JSON medications that aren't already in database (by matching name)
  const jsonMedications = autoSaveData?.medical_info?.medication_manager?.medications || [];
  if (Array.isArray(jsonMedications)) {
    const dbMedicationNames = new Set(parsedMedications.map(m => m.name.toLowerCase().trim()));
    
    jsonMedications.forEach((m: any) => {
      const medName = (m.name || '').toLowerCase().trim();
      // Only add if not already in database
      if (medName && !dbMedicationNames.has(medName)) {
        parsedMedications.push({
          id: m.id || `json-med-${Date.now()}-${Math.random()}`,
          name: m.name || '',
          dosage: m.dosage || '',
          frequency: m.frequency || '',
          status: m.status || 'active',
          notes: m.instruction || m.notes || null,
          start_date: m.start_date || null,
          end_date: m.end_date || null,
          time_of_day: m.time_of_day || null,
        });
      }
    });
  }

  // ACTIVITIES: Merge database records with any unsaved JSON activities
  let parsedActivities: CarePlanSummaryActivity[] = [];
  
  // First, add all database activities
  if (dbActivities.length > 0) {
    parsedActivities = dbActivities.map((a) => ({
      id: a.id,
      name: a.name || '',
      description: a.description || null,
      frequency: a.frequency || '',
      status: a.status || 'active',
      time_of_day: a.time_of_day || null,
    }));
  }
  
  // Then, add any JSON activities that aren't already in database (by matching name)
  const jsonActivities = autoSaveData?.activities || [];
  if (Array.isArray(jsonActivities)) {
    const dbActivityNames = new Set(parsedActivities.map(a => a.name.toLowerCase().trim()));
    
    jsonActivities.forEach((a: any, index: number) => {
      const activityName = (a.name || a.activity || '').toLowerCase().trim();
      // Only add if not already in database
      if (activityName && !dbActivityNames.has(activityName)) {
        parsedActivities.push({
          id: `activity-${index}`,
          name: a.name || a.activity || '',
          description: a.description || null,
          frequency: a.frequency || '',
          status: a.status || 'active',
          time_of_day: a.time_of_day || null,
        });
      }
    });
  }

  // GOALS: Merge database records with any unsaved JSON goals
  let parsedGoals: CarePlanSummaryGoal[] = [];
  
  // First, add all database goals
  if (dbGoals.length > 0) {
    parsedGoals = dbGoals.map((g) => ({
      id: g.id,
      description: g.description || '',
      status: g.status || 'in_progress',
      progress: g.progress || null,
      notes: g.notes || null,
      time_of_day: g.time_of_day || null,
    }));
  }
  
  // Then, add any JSON goals that aren't already in database (by matching description)
  const jsonGoals = autoSaveData?.goals || [];
  if (Array.isArray(jsonGoals)) {
    const dbGoalDescriptions = new Set(parsedGoals.map(g => g.description.toLowerCase().trim()));
    
    jsonGoals.forEach((g: any, index: number) => {
      const goalDesc = (g.description || g.goal || '').toLowerCase().trim();
      // Only add if not already in database
      if (goalDesc && !dbGoalDescriptions.has(goalDesc)) {
        parsedGoals.push({
          id: `goal-${index}`,
          description: g.description || g.goal || '',
          status: g.status || 'in_progress',
          progress: g.progress || null,
          notes: g.measurable_outcome || g.notes || null,
          time_of_day: g.time_of_day || null,
        });
      }
    });
  }

  // TASKS: Merge database tasks with Care Plan JSON tasks
  let parsedTasks: CarePlanSummaryTask[] = [];
  
  // First, add all database tasks (admin-assigned)
  if (tasks.length > 0) {
    parsedTasks = tasks.map((t) => ({
      id: t.id,
      title: t.title || '',
      description: t.description || null,
      status: t.status || 'pending',
      priority: t.priority || 'medium',
      due_date: t.due_date || null,
      notes: t.notes || null,
      category: t.category || null,
    }));
  }
  
  // Then, add Care Plan JSON tasks that aren't already in database
  const jsonTasks = autoSaveData?.tasks || [];
  if (Array.isArray(jsonTasks)) {
    const dbTaskTitles = new Set(parsedTasks.map(t => t.title.toLowerCase().trim()));
    
    jsonTasks.forEach((t: any, index: number) => {
      const taskName = (t.name || '').toLowerCase().trim();
      // Only add if not already in database
      if (taskName && !dbTaskTitles.has(taskName)) {
        parsedTasks.push({
          id: `json-task-${index}`,
          title: t.name || '',
          description: t.description || null,
          status: 'pending',
          priority: t.priority || 'medium',
          due_date: null,
          notes: null,
          category: t.category || null,
        });
      }
    });
  }

  const completedGoals = parsedGoals.filter(g => g.status === 'completed').length;
  const activeActivities = parsedActivities.filter(a => a.status === 'active').length;
  const activeMedications = parsedMedications.filter(m => m.status === 'active').length;
  const pendingTasks = parsedTasks.filter(t => t.status === 'pending' || t.status === 'todo' || t.status === 'in_progress').length;

  console.log('[useClientCarePlanSummary] Summary with database priority:', {
    carePlanId: carePlan.id,
    medicationsFromDb: dbMedications.length,
    activitiesFromDb: dbActivities.length,
    goalsFromDb: dbGoals.length,
    tasksFromDb: tasks.length,
    tasksFromJson: jsonTasks.length,
    totalTasks: parsedTasks.length,
  });

  return {
    carePlan: { id: carePlan.id, title: carePlan.title, status: carePlan.status, display_id: carePlan.display_id },
    goals: { total: parsedGoals.length, completed: completedGoals, items: parsedGoals },
    activities: { total: parsedActivities.length, active: activeActivities, items: parsedActivities },
    medications: { total: parsedMedications.length, active: activeMedications, items: parsedMedications },
    tasks: { total: parsedTasks.length, pending: pendingTasks, items: parsedTasks },
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
