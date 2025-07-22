
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useCarePlanActions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteDraftMutation = useMutation({
    mutationFn: async (carePlanId: string) => {
      const { error } = await supabase
        .from('client_care_plans')
        .delete()
        .eq('id', carePlanId)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast({
        title: "Draft deleted",
        description: "The care plan draft has been deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive",
      });
    }
  });

  const activateDraftMutation = useMutation({
    mutationFn: async (carePlanId: string) => {
      const { error } = await supabase
        .from('client_care_plans')
        .update({ 
          status: 'active',
          completion_percentage: 100 
        })
        .eq('id', carePlanId)
        .eq('status', 'draft');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      toast({
        title: "Care plan activated",
        description: "The care plan has been activated successfully",
      });
    },
    onError: (error) => {
      console.error('Error activating care plan:', error);
      toast({
        title: "Error",
        description: "Failed to activate care plan. Please try again.",
        variant: "destructive",
      });
    }
  });

  return {
    deleteDraft: deleteDraftMutation.mutate,
    activateDraft: activateDraftMutation.mutate,
    isDeletingDraft: deleteDraftMutation.isPending,
    isActivatingDraft: activateDraftMutation.isPending,
  };
}
