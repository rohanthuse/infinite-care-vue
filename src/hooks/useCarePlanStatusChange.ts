import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StatusChangeData {
  carePlanId: string;
  newStatus: string;
  reason?: string;
}

export function useCarePlanStatusChange() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusChangeMutation = useMutation({
    mutationFn: async ({ carePlanId, newStatus, reason }: StatusChangeData) => {
      // Update the care plan status
      const { error: updateError } = await supabase
        .from('client_care_plans')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', carePlanId);

      if (updateError) throw updateError;

      // Insert status change history
      const { error: historyError } = await supabase
        .from('care_plan_status_history')
        .insert({
          care_plan_id: carePlanId,
          new_status: newStatus,
          previous_status: null, // Will be handled by trigger
          reason: reason || null,
          changed_by: null, // Will be set by auth context in RLS
          changed_by_type: 'admin'
        });

      if (historyError) throw historyError;

      return { carePlanId, newStatus };
    },
    onSuccess: ({ carePlanId, newStatus }) => {
      // Invalidate care plan queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      
      toast({
        title: "Status Updated",
        description: `Care plan status changed to ${newStatus}`,
        variant: "default",
      });
    },
    onError: (error) => {
      console.error('Error updating care plan status:', error);
      toast({
        title: "Error",
        description: "Failed to update care plan status. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    changeStatus: statusChangeMutation.mutate,
    isChanging: statusChangeMutation.isPending,
  };
}