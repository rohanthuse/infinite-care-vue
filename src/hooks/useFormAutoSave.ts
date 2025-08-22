import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface AutoSaveOptions {
  onSave: (data: Record<string, any>, isDraft: boolean) => Promise<void>;
  delay?: number;
  enabled?: boolean;
}

export const useFormAutoSave = (options: AutoSaveOptions) => {
  const { onSave, delay = 30000, enabled = true } = options; // Auto-save every 30 seconds
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSave = useCallback(async (formData: Record<string, any>) => {
    if (!enabled || isSaving || !hasUnsavedChanges) return;

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
  }, [enabled, isSaving, hasUnsavedChanges, onSave]);

  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    setLastSaveTime(new Date());
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      // This will be called by the component that uses this hook
      // We can't access formData here, so we'll trigger this from the component
    }, delay);

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, delay, enabled]);

  return {
    lastSaveTime,
    isSaving,
    hasUnsavedChanges,
    autoSave,
    markAsChanged,
    markAsSaved
  };
};