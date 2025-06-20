
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { FormElement as UIFormElement } from "@/types/form-builder";

export interface DatabaseFormElement {
  id: string;
  form_id: string;
  element_type: string;
  label: string;
  required: boolean;
  order_index: number;
  properties: Record<string, any>;
  validation_rules: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export const useFormElements = (formId: string) => {
  const queryClient = useQueryClient();

  // Fetch form elements for a specific form
  const {
    data: elements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['form-elements', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_elements')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as DatabaseFormElement[];
    },
    enabled: !!formId,
  });

  // Convert database form elements to UI form elements
  const convertToUIElements = (dbElements: DatabaseFormElement[]): UIFormElement[] => {
    return dbElements.map((dbElement) => {
      const baseElement = {
        id: dbElement.id,
        type: dbElement.element_type as any,
        label: dbElement.label,
        required: dbElement.required,
        order: dbElement.order_index,
        errorMessage: dbElement.validation_rules?.errorMessage,
        ...dbElement.properties,
      };

      return baseElement as UIFormElement;
    });
  };

  // Save form elements mutation
  const saveElementsMutation = useMutation({
    mutationFn: async ({ formId, elements }: { formId: string; elements: UIFormElement[] }) => {
      // First, delete existing elements for this form
      const { error: deleteError } = await supabase
        .from('form_elements')
        .delete()
        .eq('form_id', formId);

      if (deleteError) throw deleteError;

      // Then insert the new elements
      if (elements.length > 0) {
        const dbElements = elements.map((element, index) => ({
          form_id: formId,
          element_type: element.type,
          label: element.label,
          required: element.required,
          order_index: index,
          properties: {
            placeholder: (element as any).placeholder,
            defaultValue: (element as any).defaultValue,
            options: (element as any).options,
            maxLength: (element as any).maxLength,
            minLength: (element as any).minLength,
            min: (element as any).min,
            max: (element as any).max,
            step: (element as any).step,
            rows: (element as any).rows,
            accept: (element as any).accept,
            multiple: (element as any).multiple,
            headingLevel: (element as any).headingLevel,
            text: (element as any).text,
            title: (element as any).title,
            description: (element as any).description,
            collapsible: (element as any).collapsible,
            defaultCollapsed: (element as any).defaultCollapsed,
          },
          validation_rules: {
            errorMessage: element.errorMessage,
          },
        }));

        const { error: insertError } = await supabase
          .from('form_elements')
          .insert(dbElements);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-elements', formId] });
      toast({
        title: "Success",
        description: "Form elements saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save form elements: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    elements,
    uiElements: convertToUIElements(elements),
    isLoading,
    error,
    saveElements: saveElementsMutation.mutate,
    isSaving: saveElementsMutation.isPending,
  };
};
