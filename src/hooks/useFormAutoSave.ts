import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  onSave: (data: Record<string, any>, isDraft: boolean) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useFormAutoSave = (options: AutoSaveOptions) => {
  const { onSave, delay = 30000, enabled = true } = options;
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const formDataRef = useRef<Record<string, any>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const autoSave = useCallback(async (formData: Record<string, any>) => {
    if (!enabled || isSaving) return;

    try {
      setIsSaving(true);
      await onSave(formData, true); // Save as draft
      setLastSaveTime(new Date());
      setHasUnsavedChanges(false);
      
      toast({
        title: "Auto-saved",
        description: "Your progress has been automatically saved",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Don't show error toast for auto-save failures to avoid being intrusive
    } finally {
      setIsSaving(false);
    }
  }, [enabled, isSaving, onSave]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaveTime(new Date());
  }, []);

  // Update form data ref for auto-save timer
  const updateFormData = useCallback((data: Record<string, any>) => {
    formDataRef.current = data;
    markAsChanged();
  }, [markAsChanged]);

  // Auto-save effect with proper timer management
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) {
      // Clear timer if disabled or no changes
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Set up auto-save timer
    timerRef.current = setTimeout(() => {
      if (hasUnsavedChanges && Object.keys(formDataRef.current).length > 0) {
        autoSave(formDataRef.current);
      }
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasUnsavedChanges, delay, enabled, autoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    lastSaveTime,
    isSaving,
    hasUnsavedChanges,
    autoSave,
    markAsChanged,
    markAsSaved,
    updateFormData
  };
};