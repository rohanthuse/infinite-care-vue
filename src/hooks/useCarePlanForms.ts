import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CarePlanForm {
  id: string;
  care_plan_id: string;
  form_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  completion_notes?: string;
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
  form?: {
    id: string;
    title: string;
    description?: string;
    published: boolean;
  };
}

export interface AvailableForm {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  created_at: string;
}

export const useCarePlanForms = (carePlanId: string) => {
  const queryClient = useQueryClient();

  // Fetch forms assigned to this care plan
  const {
    data: assignedForms = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['care-plan-forms', carePlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('care_plan_forms')
        .select(`
          *,
          form:forms (
            id,
            title,
            description,
            published
          )
        `)
        .eq('care_plan_id', carePlanId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as CarePlanForm[];
    },
    enabled: !!carePlanId,
  });

  // Assign form to care plan
  const assignFormMutation = useMutation({
    mutationFn: async ({
      formId,
      dueDate,
    }: {
      formId: string;
      dueDate?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('care_plan_forms')
        .insert({
          care_plan_id: carePlanId,
          form_id: formId,
          assigned_by: userData.user.id,
          due_date: dueDate,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-forms', carePlanId] });
      toast.success('Form assigned to care plan successfully');
    },
    onError: (error: any) => {
      console.error('Error assigning form:', error);
      toast.error(error.message || 'Failed to assign form');
    },
  });

  // Update form status
  const updateFormStatusMutation = useMutation({
    mutationFn: async ({
      carePlanFormId,
      status,
      completionNotes,
    }: {
      carePlanFormId: string;
      status: CarePlanForm['status'];
      completionNotes?: string;
    }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completion_notes = completionNotes;
      }

      const { data, error } = await supabase
        .from('care_plan_forms')
        .update(updateData)
        .eq('id', carePlanFormId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-forms', carePlanId] });
      toast.success('Form status updated successfully');
    },
    onError: (error: any) => {
      console.error('Error updating form status:', error);
      toast.error(error.message || 'Failed to update form status');
    },
  });

  // Remove form from care plan
  const removeFormMutation = useMutation({
    mutationFn: async (carePlanFormId: string) => {
      const { error } = await supabase
        .from('care_plan_forms')
        .delete()
        .eq('id', carePlanFormId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['care-plan-forms', carePlanId] });
      toast.success('Form removed from care plan');
    },
    onError: (error: any) => {
      console.error('Error removing form:', error);
      toast.error(error.message || 'Failed to remove form');
    },
  });

  return {
    assignedForms,
    isLoading,
    error,
    assignForm: assignFormMutation.mutate,
    updateFormStatus: updateFormStatusMutation.mutate,
    removeForm: removeFormMutation.mutate,
    isAssigning: assignFormMutation.isPending,
    isUpdating: updateFormStatusMutation.isPending,
    isRemoving: removeFormMutation.isPending,
  };
};

// Hook to get available forms for assignment
export const useAvailableForms = (branchId: string) => {
  return useQuery({
    queryKey: ['available-forms', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, published, created_at')
        .eq('branch_id', branchId)
        .eq('published', true)
        .order('title');

      if (error) throw error;
      return data as AvailableForm[];
    },
    enabled: !!branchId,
  });
};