import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FormElement } from '@/types/form-builder';

export interface SystemTemplateElement {
  id: string;
  template_id: string;
  element_type: string;
  label: string;
  required: boolean;
  order_index: number;
  properties: Record<string, any>;
  validation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Fetch template elements
export const useSystemTemplateElements = (templateId: string | undefined) => {
  return useQuery({
    queryKey: ['system-template-elements', templateId],
    queryFn: async () => {
      if (!templateId) return [];
      
      const { data, error } = await supabase
        .from('system_template_elements')
        .select('*')
        .eq('template_id', templateId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('[useSystemTemplateElements] Error fetching elements:', error);
        throw error;
      }

      return data as SystemTemplateElement[];
    },
    enabled: !!templateId,
  });
};

// Convert database elements to UI format
export const convertToUIElements = (dbElements: SystemTemplateElement[]): FormElement[] => {
  return dbElements.map(el => ({
    id: el.id,
    type: el.element_type as FormElement['type'],
    label: el.label,
    required: el.required,
    order: el.order_index,
    ...el.properties,
  })) as FormElement[];
};

// Convert UI elements to database format
export const convertToDBElements = (uiElements: FormElement[], templateId: string): Omit<SystemTemplateElement, 'id' | 'created_at' | 'updated_at'>[] => {
  return uiElements.map((el, index) => {
    const { id, type, label, required, order, ...properties } = el;
    return {
      template_id: templateId,
      element_type: type,
      label,
      required,
      order_index: index,
      properties,
      validation_rules: {},
    };
  });
};

// Save template elements (delete all and insert new)
export const useSaveSystemTemplateElements = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, elements }: { templateId: string; elements: FormElement[] }) => {
      // Delete existing elements
      const { error: deleteError } = await supabase
        .from('system_template_elements')
        .delete()
        .eq('template_id', templateId);

      if (deleteError) {
        console.error('[useSaveSystemTemplateElements] Error deleting elements:', deleteError);
        throw deleteError;
      }

      // Insert new elements if any
      if (elements.length > 0) {
        const dbElements = convertToDBElements(elements, templateId);
        
        const { error: insertError } = await supabase
          .from('system_template_elements')
          .insert(dbElements);

        if (insertError) {
          console.error('[useSaveSystemTemplateElements] Error inserting elements:', insertError);
          throw insertError;
        }
      }

      return true;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['system-template-elements', variables.templateId] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save template elements',
        variant: 'destructive',
      });
    },
  });
};
