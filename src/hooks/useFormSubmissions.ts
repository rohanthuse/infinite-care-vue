
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface FormSubmission {
  id: string;
  form_id: string;
  branch_id: string;
  submitted_by: string;
  submitted_by_type: 'client' | 'staff' | 'carer';
  submitter_name?: string;
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
        .select(`
          *,
          staff:staff(first_name, last_name, auth_user_id),
          client:clients(first_name, last_name, auth_user_id)
        `)
        .eq('branch_id', branchId)
        .order('submitted_at', { ascending: false });

      if (formId) {
        query = query.eq('form_id', formId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to include submitter names
      const mappedData = data?.map((submission: any) => {
        let submitter_name = 'Unknown user';
        
        // Check if submitted_by matches a staff member's auth_user_id
        if (submission.staff && submission.staff.some((s: any) => s.auth_user_id === submission.submitted_by)) {
          const staff = submission.staff.find((s: any) => s.auth_user_id === submission.submitted_by);
          submitter_name = `${staff.first_name} ${staff.last_name}`.trim();
        }
        // Check if submitted_by matches a client's auth_user_id
        else if (submission.client && submission.client.some((c: any) => c.auth_user_id === submission.submitted_by)) {
          const client = submission.client.find((c: any) => c.auth_user_id === submission.submitted_by);
          submitter_name = `${client.first_name} ${client.last_name}`.trim();
        }
        // If no match found but we have a name, use just the first few chars of ID
        else if (!submitter_name || submitter_name === 'Unknown user') {
          submitter_name = `Unknown user (${submission.submitted_by.slice(-8)})`;
        }

        return {
          ...submission,
          submitter_name,
          staff: undefined, // Remove the joined data
          client: undefined, // Remove the joined data
        };
      }) || [];

      return mappedData as FormSubmission[];
    },
  });

  // Create or update submission mutation
  const upsertSubmissionMutation = useMutation({
    mutationFn: async (submissionData: {
      form_id: string;
      submitted_by: string;
      submitted_by_type: 'client' | 'staff' | 'carer';
      submission_data: Record<string, any>;
      status?: 'draft' | 'completed' | 'under_review' | 'approved' | 'rejected';
    }) => {
      // First check if a submission already exists
      const { data: existingSubmission } = await supabase
        .from('form_submissions')
        .select('id, status')
        .eq('form_id', submissionData.form_id)
        .eq('submitted_by', submissionData.submitted_by)
        .single();

      if (existingSubmission) {
        // Update existing submission
        const { data, error } = await supabase
          .from('form_submissions')
          .update({
            submission_data: submissionData.submission_data,
            status: submissionData.status || existingSubmission.status,
            submitted_at: submissionData.status === 'completed' ? new Date().toISOString() : undefined
          })
          .eq('id', existingSubmission.id)
          .select()
          .single();

        if (error) throw error;
        return { data, isUpdate: true };
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('form_submissions')
          .insert([{
            form_id: submissionData.form_id,
            branch_id: branchId,
            submitted_by: submissionData.submitted_by,
            submitted_by_type: submissionData.submitted_by_type,
            submission_data: submissionData.submission_data,
            status: submissionData.status || 'completed',
          }])
          .select()
          .single();

        if (error) throw error;
        return { data, isUpdate: false };
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', branchId] });
      queryClient.invalidateQueries({ queryKey: ['my-assigned-forms'] });
      
      const isDraft = variables.status === 'draft';
      const isUpdate = result.isUpdate;
      
      if (!isDraft) {
        toast({
          title: "Success",
          description: isUpdate ? "Form updated and submitted successfully" : "Form submitted successfully",
        });
      }
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
    createSubmission: upsertSubmissionMutation.mutate,
    updateSubmission: updateSubmissionMutation.mutate,
    isCreating: upsertSubmissionMutation.isPending,
    isUpdating: updateSubmissionMutation.isPending,
  };
};
