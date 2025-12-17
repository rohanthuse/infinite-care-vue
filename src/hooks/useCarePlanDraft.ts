
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useRef } from "react";

interface DraftData {
  form_data: any;
  current_step: number;
  completion_percentage: number;
}

// Helper function to safely format dates
const formatDateSafely = (date: any): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  
  if (typeof date === 'string') {
    // If it's already a string, check if it's a valid date format
    if (date.includes('T')) {
      // If it's an ISO string, extract just the date part
      return date.split('T')[0];
    }
    // If it's already in YYYY-MM-DD format, return as is
    return date;
  }
  
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  
  // Try to parse as date if it's something else
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

// Function to calculate content-based completion percentage
const calculateContentBasedCompletion = (formData: any): number => {
  if (!formData) return 0;

  const sections = [
    {
      id: "basic_info",
      data: {
        title: formData.title,
        provider_type: formData.provider_type,
        start_date: formData.start_date,
        priority: formData.priority
      }
    },
    {
      id: "personal_info",
      data: formData.personal_info
    },
    {
      id: "about_me",
      data: formData.about_me
    },
    {
      id: "medical_info",
      data: formData.medical_info
    },
    {
      id: "goals",
      data: formData.goals
    },
    {
      id: "activities",
      data: formData.activities
    },
    {
      id: "personal_care",
      data: formData.personal_care
    },
    {
      id: "dietary",
      data: formData.dietary
    },
    {
      id: "risk_assessments",
      data: formData.risk_assessments
    },
    {
      id: "equipment",
      data: formData.equipment
    },
    {
      id: "service_plans",
      data: formData.service_plans
    },
    {
      id: "service_actions",
      data: formData.service_actions
    },
    {
      id: "documents",
      data: formData.documents
    }
  ];

  const getSectionStatus = (sectionData: any) => {
    if (!sectionData) return "empty";
    if (typeof sectionData === "object" && Object.keys(sectionData).length === 0) return "empty";
    if (Array.isArray(sectionData) && sectionData.length === 0) return "empty";
    return "completed";
  };

  const completedSections = sections.filter(section => getSectionStatus(section.data) === "completed");
  return Math.round((completedSections.length / sections.length) * 100);
};

export function useCarePlanDraft(clientId: string, carePlanId?: string, forceNew: boolean = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isManualSavingRef = useRef(false);

  // ALWAYS check for existing draft for this client, regardless of forceNew
  // This prevents creating duplicate drafts
  const { data: existingDraft, isLoading: isCheckingExistingDraft } = useQuery({
    queryKey: ['existing-care-plan-draft', clientId],
    queryFn: async () => {
      // If we already have a specific carePlanId, use that instead
      if (carePlanId) return null;
      
      // Always check for existing draft for this client
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id, auto_save_data, last_step_completed, completion_percentage, status')
        .eq('client_id', clientId)
        .eq('status', 'draft') // Only look for draft status
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error checking for existing draft:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!clientId && !carePlanId,
  });

  // Determine the effective care plan ID (provided or from existing draft)
  // Always use existing draft if one exists for this client
  const effectiveCarePlanId = carePlanId || existingDraft?.id;

  // Query to load existing draft data
  const { data: draftData, isLoading: isDraftLoading } = useQuery({
    queryKey: ['care-plan-draft', effectiveCarePlanId],
    queryFn: async () => {
      if (!effectiveCarePlanId) return null;
      
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('auto_save_data, last_step_completed, completion_percentage, status')
        .eq('id', effectiveCarePlanId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    },
    enabled: !!effectiveCarePlanId,
  });

  // Mutation to save draft
  const saveDraftMutation = useMutation({
    mutationFn: async ({ formData, currentStep, isAutoSave = false }: {
      formData: any;
      currentStep: number;
      isAutoSave?: boolean;
    }) => {
      // Prevent auto-save if manual save is in progress
      if (isAutoSave && isManualSavingRef.current) {
        throw new Error('Manual save in progress, skipping auto-save');
      }

      // Calculate content-based completion percentage instead of step-based
      const completionPercentage = calculateContentBasedCompletion(formData);
      
      const draftPayload: any = {
        client_id: clientId,
        title: formData.title || `Draft Care Plan for Client`,
        auto_save_data: formData,
        last_step_completed: currentStep,
        completion_percentage: completionPercentage,
        start_date: formatDateSafely(formData.start_date),
        priority: formData.priority || 'medium',
        care_plan_type: formData.care_plan_type || 'standard',
        provider_name: formData.provider_name || 'Not Assigned',
      };

      // Only set status to 'draft' for new care plans, preserve existing status for updates
      if (!effectiveCarePlanId) {
        draftPayload.status = 'draft';
      }

      // Use existing draft ID if available, otherwise create new
      const targetCarePlanId = effectiveCarePlanId;

      if (targetCarePlanId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('client_care_plans')
          .update(draftPayload)
          .eq('id', targetCarePlanId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new draft only if no existing draft found
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
      queryClient.invalidateQueries({ queryKey: ['existing-care-plan-draft', clientId] });
      
      // Only show toast for manual saves, not auto-saves
      if (!variables.isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your care plan draft has been saved successfully",
        });
      }
    },
    onError: (error, variables) => {
      console.error('Error saving draft:', error);
      
      // Skip error toast for cancelled auto-saves during manual save
      if (variables.isAutoSave && error.message?.includes('Manual save in progress')) {
        return;
      }
      
      if (!variables.isAutoSave) {
        toast({
          title: "Error",
          description: "Failed to save draft. Please try again.",
          variant: "destructive",
        });
      }
    },
    onSettled: (data, error, variables) => {
      // Clear manual save flag when manual save completes
      if (!variables.isAutoSave) {
        isManualSavingRef.current = false;
      }
    }
  });

  // Auto-save function with debouncing
  const autoSave = useCallback((formData: any, currentStep: number) => {
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Don't set new auto-save if manual save is in progress
    if (isManualSavingRef.current) {
      return;
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Double-check manual save isn't in progress before executing
      if (!isManualSavingRef.current) {
        saveDraftMutation.mutate({
          formData,
          currentStep,
          isAutoSave: true,
        });
      }
    }, 30000); // Auto-save after 30 seconds of inactivity
  }, [saveDraftMutation]);

  // Manual save function with coordination
  const saveDraft = useCallback(async (formData: any, currentStep: number): Promise<void> => {
    // Set manual save flag and clear auto-save
    isManualSavingRef.current = true;
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Return a promise that resolves when save completes
    return new Promise((resolve, reject) => {
      saveDraftMutation.mutate(
        {
          formData,
          currentStep,
          isAutoSave: false,
        },
        {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        }
      );
    });
  }, [saveDraftMutation]);

  return {
    draftData,
    isDraftLoading: isDraftLoading || isCheckingExistingDraft,
    saveDraft,
    autoSave,
    isSaving: saveDraftMutation.isPending,
    savedCarePlanId: saveDraftMutation.data?.id || effectiveCarePlanId,
    existingDraftId: existingDraft?.id,
  };
}
