
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FormSubmission {
  id: string;
  form_id: string;
  branch_id: string;
  submitted_by: string;
  submitted_by_type: 'client' | 'staff' | 'carer';
  submission_data: Record<string, any>;
  status: 'draft' | 'completed' | 'under_review' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

export const useFormSubmissions = (branchId: string, formId?: string) => {
  const queryClient = useQueryClient();

  // Fetch submissions for a branch or specific form
  const {
    data: submissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['form-submissions', branchId, formId],
    queryFn: async () => {
      let query = supabase
        .from('form_submissions')
        .select('*')
        .eq('branch_id', branchId)
        .order('submitted_at', { ascending: false });

      if (formId) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FormSubmission[];
    },
  });

  // Create submission mutation
  const createSubmissionMutation = useMutation({
    mutationFn: async (submissionData: Partial<FormSubmission>) => {
      const { data, error } = await supabase
        .from('form_submissions')
        .insert([{
          ...submissionData,
          branch_id: branchId,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', branchId] });
      toast({
        title: "Success",
        description: "Form submitted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit form: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Update submission mutation
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, updates }: { submissionId: string; updates: Partial<FormSubmission> }) => {
      const { data, error } = await supabase
        .from('form_submissions')
        .update(updates)
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', branchId] });
      toast({
        title: "Success",
        description: "Submission updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update submission: " + error.message,
        variant: "destructive",
      });
    },
  });

  return {
    submissions,
    isLoading,
    error,
    createSubmission: createSubmissionMutation.mutate,
    updateSubmission: updateSubmissionMutation.mutate,
    isCreating: createSubmissionMutation.isPending,
    isUpdating: updateSubmissionMutation.isPending,
  };
};
