import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CarePlanServiceAction {
  id: string;
  action_name: string;
  service_name?: string;
  start_date?: string;
  end_date?: string;
  schedule_type?: string;
  shift_times?: string[];
  start_time?: string;
  end_time?: string;
  selected_days?: string[];
  status: string;
  source: 'care_plan_draft' | 'care_plan';
  care_plan_id: string;
  care_plan_status: string;
  instructions?: string;
  written_outcome?: string;
}

/**
 * Hook to fetch service actions from the active care plan's auto_save_data JSON.
 * This ensures service actions are visible in Client Details even when the care plan is in draft status.
 */
export const useCarePlanServiceActions = (clientId: string) => {
  return useQuery({
    queryKey: ["care-plan-service-actions", clientId],
    queryFn: async () => {
      if (!clientId) return [];

      // Fetch the most recent care plan for this client (any status except archived)
      const { data: carePlans, error } = await supabase
        .from("client_care_plans")
        .select("id, status, auto_save_data")
        .eq("client_id", clientId)
        .neq("status", "archived")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching care plan for service actions:", error);
        return [];
      }

      if (!carePlans || carePlans.length === 0) {
        return [];
      }

      const carePlan = carePlans[0];
      const autoSaveData = carePlan.auto_save_data as Record<string, any> | null;

      if (!autoSaveData || !autoSaveData.service_actions) {
        return [];
      }

      const serviceActionsFromJson = autoSaveData.service_actions as any[];

      // Transform care plan JSON service actions to match display format
      return serviceActionsFromJson.map((action: any, index: number) => ({
        id: action.id || `cp-sa-${index}`,
        action_name: action.action_name || action.actionName || action.service_name || 'Unnamed Action',
        service_name: action.service_name || action.action_name || action.actionName,
        start_date: action.start_date || action.startDate,
        end_date: action.end_date || action.endDate,
        schedule_type: action.schedule_type || action.scheduleType,
        shift_times: action.shift_times || action.shiftTimes || [],
        start_time: action.start_time || action.startTime,
        end_time: action.end_time || action.endTime,
        selected_days: action.selected_days || action.selectedDays || [],
        status: action.status || 'active',
        source: carePlan.status === 'draft' ? 'care_plan_draft' : 'care_plan',
        care_plan_id: carePlan.id,
        care_plan_status: carePlan.status,
        instructions: action.instructions,
        written_outcome: action.written_outcome || action.writtenOutcome,
      })) as CarePlanServiceAction[];
    },
    enabled: !!clientId,
  });
};
