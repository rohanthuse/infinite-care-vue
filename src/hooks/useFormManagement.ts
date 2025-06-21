
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface DatabaseForm {
  id: string;
  title: string;
  description?: string;
  branch_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  requires_review: boolean;
  version: number;
  status: 'draft' | 'published' | 'archived';
  settings: {
    showProgressBar: boolean;
    allowSaveAsDraft: boolean;
    autoSaveEnabled: boolean;
    autoSaveInterval: number;
    redirectAfterSubmit: boolean;
    redirectUrl?: string;
    submitButtonText: string;
  };
}

export interface FormElement {
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

export interface FormAssignee {
  id: string;
  form_id: string;
  assignee_type: 'client' | 'staff' | 'branch' | 'carer';
  assignee_id: string;
  assignee_name: string;
  assigned_at: string;
  assigned_by: string;
}

export const useFormManagement = (branchId: string) => {
  const queryClient = useQueryClient();

  // Fetch forms for a branch
  const {
    data: forms = [],
    isLoading: isLoadingForms,
    error: formsError,
  } = useQuery({
    queryKey: ['forms', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DatabaseForm[];
    },
  });

  // Fetch form elements for forms
  const {
    data: formElements = [],
    isLoading: isLoadingElements,
  } = useQuery({
    queryKey: ['form-elements', branchId],
    queryFn: async () => {
      if (forms.length === 0) return [];
      
      const formIds = forms.map(f => f.id);
      const { data, error } = await supabase
        .from('form_elements')
        .select('*')
        .in('form_id', formIds)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as FormElement[];
    },
    enabled: forms.length > 0,
  });

  // Fetch form assignees
  const {
    data: formAssignees = [],
    isLoading: isLoadingAssignees,
  } = useQuery({
    queryKey: ['form-assignees', branchId],
    queryFn: async () => {
      if (forms.length === 0) return [];
      
      const formIds = forms.map(f => f.id);
      const { data, error } = await supabase
        .from('form_assignees')
        .select('*')
        .in('form_id', formIds)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as FormAssignee[];
    },
    enabled: forms.length > 0,
  });

  // Create form mutation - improved to return the created form and navigate
  const createFormMutation = useMutation({
    mutationFn: async (formData: Partial<DatabaseForm> & { title: string; created_by: string }) => {
      const { data, error } = await supabase
        .from('forms')
        .insert([{
          title: formData.title,
          description: formData.description || '',
          branch_id: branchId,
          created_by: formData.created_by,
          published: formData.published || false,
          requires_review: formData.requires_review || false,
          settings: formData.settings || {
            showProgressBar: false,
            allowSaveAsDraft: false,
            autoSaveEnabled: false,
            autoSaveInterval: 60,
            redirectAfterSubmit: false,
            submitButtonText: 'Submit'
          }
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['forms', branchId] });
      toast({
        title: "Success",
        description: "Form created successfully",
      });
      
      // Navigate to the newly created form
      const encodedBranchName = encodeURIComponent(window.location.pathname.split('/')[3] || 'branch');
      window.location.href = `/branch-dashboard/${branchId}/${encodedBranchName}/form-builder/${data.id}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create form: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async ({ formId, updates }: { formId: string; updates: Partial<DatabaseForm> }) => {
      const { data, error } = await supabase
        .from('forms')
        .update(updates)
        .eq('id', formId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', branchId] });
      toast({
        title: "Success",
        description: "Form updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update form: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', branchId] });
      toast({
        title: "Success",
        description: "Form deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete form: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Duplicate form mutation
  const duplicateFormMutation = useMutation({
    mutationFn: async ({ formId, userId }: { formId: string; userId: string }) => {
      // First get the original form
      const { data: originalForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;

      // Create new form with duplicated data
      const { data: newForm, error: createError } = await supabase
        .from('forms')
        .insert([{
          title: `${originalForm.title} (Copy)`,
          description: originalForm.description || '',
          branch_id: originalForm.branch_id,
          created_by: userId,
          published: false,
          requires_review: originalForm.requires_review,
          settings: originalForm.settings,
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Get original form elements
      const { data: originalElements, error: elementsError } = await supabase
        .from('form_elements')
        .select('*')
        .eq('form_id', formId)
        .order('order_index', { ascending: true });

      if (elementsError) throw elementsError;

      // Duplicate form elements if any exist
      if (originalElements && originalElements.length > 0) {
        const duplicatedElements = originalElements.map(element => ({
          form_id: newForm.id,
          element_type: element.element_type,
          label: element.label,
          required: element.required,
          order_index: element.order_index,
          properties: element.properties,
          validation_rules: element.validation_rules,
        }));

        const { error: insertElementsError } = await supabase
          .from('form_elements')
          .insert(duplicatedElements);

        if (insertElementsError) throw insertElementsError;
      }

      return newForm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms', branchId] });
      queryClient.invalidateQueries({ queryKey: ['form-elements', branchId] });
      toast({
        title: "Success",
        description: "Form duplicated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to duplicate form: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    forms,
    formElements,
    formAssignees,
    isLoading: isLoadingForms || isLoadingElements || isLoadingAssignees,
    error: formsError,
    createForm: createFormMutation.mutate,
    updateForm: updateFormMutation.mutate,
    deleteForm: deleteFormMutation.mutate,
    duplicateForm: duplicateFormMutation.mutate,
    isCreating: createFormMutation.isPending,
    isUpdating: updateFormMutation.isPending,
    isDeleting: deleteFormMutation.isPending,
    isDuplicating: duplicateFormMutation.isPending,
  };
};
