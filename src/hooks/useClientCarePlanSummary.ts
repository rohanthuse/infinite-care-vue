import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarePlanSummaryGoal {
  id: string;
  description: string;
  status: string;
  progress: number | null;
}

export interface CarePlanSummaryActivity {
  id: string;
  name: string;
  frequency: string;
  status: string;
}

export interface CarePlanSummaryMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  status: string;
}

export interface CarePlanSummaryTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
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

  // Fetch active care plan for client
  const { data: carePlan, error: carePlanError } = await supabase
    .from('client_care_plans')
    .select('id, title, status, display_id')
    .eq('client_id', clientId)
    .eq('status', 'active')
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

  // Fetch all related data in parallel
  const [goalsResult, activitiesResult, medicationsResult, tasksResult] = await Promise.all([
    // Goals
    supabase
      .from('client_care_plan_goals')
      .select('id, description, status, progress')
      .eq('care_plan_id', carePlan.id)
      .order('created_at', { ascending: false }),

    // Activities
    supabase
      .from('client_activities')
      .select('id, name, frequency, status')
      .eq('care_plan_id', carePlan.id)
      .order('created_at', { ascending: false }),

    // Medications (linked to care plan)
    supabase
      .from('client_medications')
      .select('id, name, dosage, frequency, status')
      .eq('care_plan_id', carePlan.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),

    // Tasks (for client)
    supabase
      .from('tasks')
      .select('id, title, status, priority, due_date')
      .eq('client_id', clientId)
      .in('status', ['pending', 'in_progress', 'todo'])
      .order('due_date', { ascending: true })
      .limit(10),
  ]);

  const goals = goalsResult.data || [];
  const activities = activitiesResult.data || [];
  const medications = medicationsResult.data || [];
  const tasks = tasksResult.data || [];

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeActivities = activities.filter(a => a.status === 'active').length;
  const activeMedications = medications.filter(m => m.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length;

  console.log('[useClientCarePlanSummary] Summary:', {
    carePlanId: carePlan.id,
    goals: goals.length,
    activities: activities.length,
    medications: medications.length,
    tasks: tasks.length,
  });

  return {
    carePlan,
    goals: { total: goals.length, completed: completedGoals, items: goals },
    activities: { total: activities.length, active: activeActivities, items: activities },
    medications: { total: medications.length, active: activeMedications, items: medications },
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
