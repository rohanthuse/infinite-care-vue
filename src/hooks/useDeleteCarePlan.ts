
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteCarePlan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (carePlanId: string) => {
      console.log(`[useDeleteCarePlan] Deleting care plan: ${carePlanId}`);

      // First delete related records to avoid foreign key constraints
      // Delete care plan wizard steps
      await supabase
        .from('care_plan_wizard_steps')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete goals
      await supabase
        .from('client_care_plan_goals')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete activities
      await supabase
        .from('client_activities')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete medications
      await supabase
        .from('client_medications')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete service actions
      await supabase
        .from('client_service_actions')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete assessments
      await supabase
        .from('client_assessments')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Delete approvals
      await supabase
        .from('client_care_plan_approvals')
        .delete()
        .eq('care_plan_id', carePlanId);

      // Finally delete the care plan itself
      const { error } = await supabase
        .from('client_care_plans')
        .delete()
        .eq('id', carePlanId);

      if (error) {
        console.error('[useDeleteCarePlan] Error deleting care plan:', error);
        throw error;
      }

      return carePlanId;
    },
    onSuccess: (deletedCarePlanId) => {
      console.log(`[useDeleteCarePlan] Successfully deleted care plan: ${deletedCarePlanId}`);
      
      // Invalidate relevant queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans-with-details'] });
      
      toast({
        title: "Care plan deleted",
        description: "The care plan has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error('[useDeleteCarePlan] Failed to delete care plan:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete care plan. Please try again.",
        variant: "destructive",
      });
    }
  });
};
