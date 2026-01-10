import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCallback, useRef, useState } from "react";
import { calculateCompletionPercentage, CompletionContext } from "@/utils/carePlanCompletionUtils";
import { sanitizeFormData, findProblematicPaths, getFieldTabName } from "@/utils/sanitizeText";
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
    mutationFn: async ({ formData, currentStep, isAutoSave = false, isChild = false, medicationCount = 0 }: {
      formData: any;
      currentStep: number;
      isAutoSave?: boolean;
      isChild?: boolean;
      medicationCount?: number;
    }) => {
      // Prevent auto-save if manual save is in progress
      if (isAutoSave && isManualSavingRef.current) {
        throw new Error('Manual save in progress, skipping auto-save');
      }

      // For auto-saves, skip if still checking for existing draft
      // For manual saves, proceed with synchronous check below
      if (isCheckingExistingDraft && isAutoSave) {
        throw new Error('Still checking for existing draft, skipping auto-save');
      }
      
      // Calculate content-based completion percentage using unified utility
      // Now accepts context with medication count for accurate calculation
      const ctx: CompletionContext = { medicationCount };
      const completionPercentage = calculateCompletionPercentage(formData, isChild, ctx);
      
      // Sanitize form data to remove problematic Unicode characters (e.g., \u0000)
      // This prevents "unsupported Unicode escape sequence" errors from Supabase
      const sanitizedFormData = sanitizeFormData(formData);
      
      const draftPayload: any = {
        client_id: clientId,
        title: sanitizedFormData.title || `Draft Care Plan for Client`,
        auto_save_data: sanitizedFormData,
        last_step_completed: currentStep,
        completion_percentage: completionPercentage,
        start_date: formatDateSafely(sanitizedFormData.start_date),
        priority: sanitizedFormData.priority || 'medium',
        care_plan_type: sanitizedFormData.care_plan_type || 'standard',
        provider_name: sanitizedFormData.provider_name || 'Not Assigned',
        // Explicitly save primary staff_id for backward compatibility
        staff_id: sanitizedFormData.staff_id || (sanitizedFormData.staff_ids?.length > 0 ? sanitizedFormData.staff_ids[0] : null),
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
      // Invalidate care-plan-related-info so Personal Info tab updates immediately
      queryClient.invalidateQueries({ queryKey: ['care-plan-related-info', clientId] });
      
      // Only show toast for manual saves, not auto-saves
      if (!variables.isAutoSave) {
        toast({
          title: "Draft saved",
          description: "Your care plan draft has been saved successfully",
        });
      }
    },
    onError: (error: any, variables) => {
      // Enhanced error logging for debugging
      console.error('[useCarePlanDraft] Error saving draft:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        isAutoSave: variables.isAutoSave,
        clientId,
        targetCarePlanId: effectiveCarePlanId,
      });
      
      // Skip error toast for cancelled auto-saves during manual save
      if (variables.isAutoSave && error.message?.includes('Manual save in progress')) {
        return;
      }
      
      // Skip toast for "still checking" errors during auto-save
      if (variables.isAutoSave && error.message?.includes('Still checking')) {
        return;
      }
      
      if (!variables.isAutoSave) {
        // Build a more descriptive error message
        let errorDescription = "Failed to save draft. Please try again.";
        
        if (error?.code === '42501' || error?.message?.includes('RLS') || error?.message?.includes('policy')) {
          errorDescription = "Permission denied. Please ensure you're logged in.";
        } else if (error?.code === '23505') {
          errorDescription = "A draft already exists. Refreshing...";
        } else if (error?.message?.includes('Unicode') || error?.message?.includes('escape sequence')) {
          // Special handling for Unicode escape errors - provide actionable guidance
          const problematicPaths = findProblematicPaths(variables.formData);
          if (problematicPaths.length > 0) {
            // Map paths to user-friendly tab names
            const uniqueTabs = [...new Set(problematicPaths.slice(0, 3).map(getFieldTabName))];
            errorDescription = `Text contains hidden characters from copy/paste. Likely affected: ${uniqueTabs.join(', ')}. Try retyping or paste as plain text.`;
            console.warn('[useCarePlanDraft] Problematic paths found:', problematicPaths);
          } else {
            errorDescription = "Text contains hidden characters from copy/paste. Try retyping or paste as plain text.";
          }
        } else if (error?.message) {
          errorDescription = `Error: ${error.message.substring(0, 100)}`;
        }
        
        toast({
          title: "Error Saving Draft",
          description: errorDescription,
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
  const autoSave = useCallback((formData: any, currentStep: number, isChild: boolean = false, medicationCount: number = 0) => {
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
          isChild,
          medicationCount,
        });
      }
    }, 30000); // Auto-save after 30 seconds of inactivity
  }, [saveDraftMutation]);

  // Manual save function with coordination
  const saveDraft = useCallback(async (formData: any, currentStep: number, isChild: boolean = false, medicationCount: number = 0): Promise<void> => {
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
          isChild,
          medicationCount,
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
