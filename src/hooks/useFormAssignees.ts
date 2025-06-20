
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FormAssigneeData {
  id: string;
  form_id: string;
  assignee_type: 'client' | 'staff' | 'branch' | 'carer';
  assignee_id: string;
  assignee_name: string;
  assigned_at: string;
  assigned_by: string;
}

export const useFormAssignees = (formId: string) => {
  const queryClient = useQueryClient();

  // Fetch assignees for a specific form
  const {
    data: assignees = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['form-assignees', formId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_assignees')
        .select('*')
        .eq('form_id', formId)
        .order('assigned_at', { ascending: false });

      if (error) throw error;
      return data as FormAssigneeData[];
    },
    enabled: !!formId,
  });

  // Add assignee mutation
  const addAssigneeMutation = useMutation({
    mutationFn: async (assigneeData: Omit<FormAssigneeData, 'id' | 'assigned_at'>) => {
      const { data, error } = await supabase
        .from('form_assignees')
        .insert([assigneeData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-assignees', formId] });
      toast({
        title: "Success",
        description: "Assignee added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add assignee: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Remove assignee mutation
  const removeAssigneeMutation = useMutation({
    mutationFn: async (assigneeId: string) => {
      const { error } = await supabase
        .from('form_assignees')
        .delete()
        .eq('id', assigneeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-assignees', formId] });
      toast({
        title: "Success",
        description: "Assignee removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove assignee: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    assignees,
    isLoading,
    error,
    addAssignee: addAssigneeMutation.mutate,
    removeAssignee: removeAssigneeMutation.mutate,
    isAdding: addAssigneeMutation.isPending,
    isRemoving: removeAssigneeMutation.isPending,
  };
};
