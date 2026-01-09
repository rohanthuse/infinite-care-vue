import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StatusChangeData {
  carePlanId: string;
  newStatus: string;
  reason?: string;
}

const statusLabels: Record<string, string> = {
  'draft': 'Draft',
  'pending_client_approval': 'Pending Client Approval',
  'active': 'Active',
  'approved': 'Client Approved',
  'rejected': 'Changes Requested',
  'on_hold': 'On Hold',
  'completed': 'Completed',
  'archived': 'Archived',
};

export function useCarePlanStatusChange() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statusChangeMutation = useMutation({
    mutationFn: async ({ carePlanId, newStatus, reason }: StatusChangeData) => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Get the current status before updating
      const { data: currentPlan, error: fetchError } = await supabase
        .from('client_care_plans')
        .select('status')
        .eq('id', carePlanId)
        .single();

      if (fetchError) throw fetchError;

      const previousStatus = currentPlan?.status;

      // Update the care plan status
      const { error: updateError } = await supabase
        .from('client_care_plans')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', carePlanId);

      if (updateError) throw updateError;

      // Insert status change history with proper previous_status
      const { error: historyError } = await supabase
        .from('care_plan_status_history')
        .insert({
          care_plan_id: carePlanId,
          new_status: newStatus,
          previous_status: previousStatus,
          reason: reason || null,
          changed_by: user?.id || null,
          changed_by_type: 'admin'
        });

      if (historyError) {
        console.error('Error inserting status history:', historyError);
        // Don't throw - status was updated successfully
      }

      return { carePlanId, newStatus };
    },
    onSuccess: ({ newStatus }) => {
      // Invalidate care plan queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-care-plans'] });
      // Also invalidate draft-related queries to ensure wizard shows correct status
      queryClient.invalidateQueries({ queryKey: ['care-plan'] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-draft'] });
      queryClient.invalidateQueries({ queryKey: ['existing-care-plan-draft'] });
      
      const statusLabel = statusLabels[newStatus] || newStatus;
      toast({
        title: "Status Updated",
        description: `Care plan status changed to ${statusLabel}`,
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