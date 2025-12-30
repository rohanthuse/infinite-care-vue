import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useRef, useState } from "react";
import { calculateCompletionPercentage } from "@/utils/carePlanCompletionUtils";

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

export function useCarePlanDraft(clientId: string, carePlanId?: string, forceNew: boolean = false) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const isManualSavingRef = useRef(false);
  
  // Undo functionality state
  const undoHistoryRef = useRef<any[]>([]);
  const MAX_UNDO_HISTORY = 10;
  const [canUndo, setCanUndo] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

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

      // CRITICAL: Block saves until existing draft check is complete to prevent duplicates
      if (isCheckingExistingDraft) {
        throw new Error('Still checking for existing draft, please wait');
      }
      // Calculate content-based completion percentage using unified utility
      // Note: isChild detection would require client profile, for now we use false as default
      // This will be accurate for adults, and slightly undercount for children (acceptable)
      const completionPercentage = calculateCompletionPercentage(formData, false);
      
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
        // Explicitly save primary staff_id for backward compatibility
        staff_id: formData.staff_id || (formData.staff_ids?.length > 0 ? formData.staff_ids[0] : null),
      };

      // Use existing draft ID if available
      let targetCarePlanId = effectiveCarePlanId;

      // SAFETY NET: If no ID yet, do a synchronous check to prevent race condition duplicates
      if (!targetCarePlanId) {
        console.log('[useCarePlanDraft] No effectiveCarePlanId - doing synchronous check for existing draft');
        const { data: existingDraftCheck } = await supabase
          .from('client_care_plans')
          .select('id')
          .eq('client_id', clientId)
          .eq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingDraftCheck?.id) {
          console.log('[useCarePlanDraft] Found existing draft via synchronous check:', existingDraftCheck.id);
          targetCarePlanId = existingDraftCheck.id;
        }
      }

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
        // Only set status to 'draft' for new care plans
        draftPayload.status = 'draft';
        
        // Create new draft only if no existing draft found
        console.log('[useCarePlanDraft] Creating new draft for client:', clientId);
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
          onSuccess: () => {
            setLastSaveTime(new Date());
            resolve();
          },
          onError: (error) => reject(error),
        }
      );
    });
  }, [saveDraftMutation]);

  // Save undo state before changes
  const saveUndoState = useCallback((formData: any) => {
    const history = undoHistoryRef.current;
    // Deep clone the form data
    const snapshot = JSON.parse(JSON.stringify(formData));
    history.push(snapshot);
    // Keep only last N snapshots
    if (history.length > MAX_UNDO_HISTORY) {
      history.shift();
    }
    undoHistoryRef.current = history;
    setCanUndo(history.length > 1);
  }, []);

  // Undo last change
  const undoLastChange = useCallback(() => {
    const history = undoHistoryRef.current;
    if (history.length > 1) {
      // Remove current state
      history.pop();
      // Get previous state
      const previousState = history[history.length - 1];
      undoHistoryRef.current = history;
      setCanUndo(history.length > 1);
      return previousState;
    }
    return null;
  }, []);

  // Clear undo history
  const clearUndoHistory = useCallback(() => {
    undoHistoryRef.current = [];
    setCanUndo(false);
  }, []);

  return {
    draftData,
    isDraftLoading: isDraftLoading || isCheckingExistingDraft,
    isCheckingExistingDraft, // Expose separately for UI blocking
    saveDraft,
    autoSave,
    isSaving: saveDraftMutation.isPending,
    savedCarePlanId: saveDraftMutation.data?.id || effectiveCarePlanId,
    existingDraftId: existingDraft?.id,
    // Undo functionality
    saveUndoState,
    undoLastChange,
    clearUndoHistory,
    canUndo,
    lastSaveTime,
  };
}
