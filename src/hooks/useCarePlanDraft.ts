
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useRef } from "react";

interface DraftData {
  form_data: any;
  current_step: number;
  completion_percentage: number;
}

export function useCarePlanDraft(clientId: string, carePlanId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Query to load existing draft
  const { data: draftData, isLoading: isDraftLoading } = useQuery({
    queryKey: ['care-plan-draft', carePlanId],
    queryFn: async () => {
      if (!carePlanId) return null;
      
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('auto_save_data, last_step_completed, completion_percentage, status')
        .eq('id', carePlanId)
        .eq('status', 'draft')
        .single();

      if (error || !data) return null;
      return data;
    },
    enabled: !!carePlanId,
  });

  // Mutation to save draft
  const saveDraftMutation = useMutation({
    mutationFn: async ({ formData, currentStep, isAutoSave = false }: {
      formData: any;
      currentStep: number;
      isAutoSave?: boolean;
    }) => {
      const completionPercentage = Math.round((currentStep / 14) * 100);
      
      const draftPayload: any = {
        client_id: clientId,
        title: formData.title || `Draft Care Plan for Client`,
        status: 'draft',
        auto_save_data: formData,
        last_step_completed: currentStep,
        completion_percentage: completionPercentage,
        start_date: formData.start_date ? formData.start_date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: formData.priority || 'medium',
        care_plan_type: formData.care_plan_type || 'standard',
        provider_name: formData.provider_name || 'Not Assigned',
      };

      if (carePlanId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('client_care_plans')
          .update(draftPayload)
          .eq('id', carePlanId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('client_care_plans')
          .insert(draftPayload)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      queryClient.invalidateQueries({ queryKey: ['client-care-plans', clientId] });
      queryClient.invalidateQueries({ queryKey: ['care-plan-draft', data.id] });
      
      if (!variables.isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your care plan draft has been saved successfully",
        });
      }
    },
    onError: (error, variables) => {
      console.error('Error saving draft:', error);
      if (!variables.isAutoSave) {
        toast({
          title: "Error",
          description: "Failed to save draft. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Auto-save function with debouncing
  const autoSave = useCallback((formData: any, currentStep: number) => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveDraftMutation.mutate({
        formData,
        currentStep,
        isAutoSave: true,
      });
    }, 30000); // Auto-save after 30 seconds of inactivity
  }, [saveDraftMutation]);

  // Manual save function
  const saveDraft = useCallback((formData: any, currentStep: number) => {
    saveDraftMutation.mutate({
      formData,
      currentStep,
      isAutoSave: false,
    });
  }, [saveDraftMutation]);

  return {
    draftData,
    isDraftLoading,
    saveDraft,
    autoSave,
    isSaving: saveDraftMutation.isPending,
    savedCarePlanId: saveDraftMutation.data?.id,
  };
}
