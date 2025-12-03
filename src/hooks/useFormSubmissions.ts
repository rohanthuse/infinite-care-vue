
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
  // Proxy submission fields
  submitted_on_behalf_of?: string;
  submitted_by_admin?: string;
  submission_type?: 'self_submitted' | 'admin_on_behalf';
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
      // Fetch form submissions
      let submissionsQuery = supabase
        .from('form_submissions')
        .select('*')
        .eq('branch_id', branchId)
        .order('submitted_at', { ascending: false });

      if (formId) {
        submissionsQuery = submissionsQuery.eq('form_id', formId);
      }

      // Fetch staff and clients for the branch in parallel
      const [submissionsRes, staffRes, clientsRes] = await Promise.all([
        submissionsQuery,
        supabase
          .from('staff')
          .select('id, auth_user_id, first_name, last_name')
          .eq('branch_id', branchId),
        supabase
          .from('clients')
          .select('id, auth_user_id, first_name, last_name')
          .eq('branch_id', branchId)
      ]);

      if (submissionsRes.error) throw submissionsRes.error;

      // Build lookup maps
      const staffByAuth = new Map();
      const staffById = new Map();
      const clientsByAuth = new Map();
      const clientsById = new Map();

      if (staffRes.data) {
        staffRes.data.forEach((staff: any) => {
          const name = `${staff.first_name || ''} ${staff.last_name || ''}`.trim();
          if (staff.auth_user_id) staffByAuth.set(staff.auth_user_id, name);
          staffById.set(staff.id, name);
        });
      }

      if (clientsRes.data) {
        clientsRes.data.forEach((client: any) => {
          const name = `${client.first_name || ''} ${client.last_name || ''}`.trim();
          if (client.auth_user_id) clientsByAuth.set(client.auth_user_id, name);
          clientsById.set(client.id, name);
        });
      }

      // Map submissions to include submitter names
      const mappedData = submissionsRes.data?.map((submission: any) => {
        let submitter_name = '';
        
        // Try to resolve name based on submitted_by_type
        if (submission.submitted_by_type === 'client') {
          submitter_name = clientsByAuth.get(submission.submitted_by) || 
                           clientsById.get(submission.submitted_by) || 
                           staffByAuth.get(submission.submitted_by) || 
                           staffById.get(submission.submitted_by) || '';
        } else if (submission.submitted_by_type === 'staff' || submission.submitted_by_type === 'carer') {
          submitter_name = staffByAuth.get(submission.submitted_by) || 
                           staffById.get(submission.submitted_by) || 
                           clientsByAuth.get(submission.submitted_by) || 
                           clientsById.get(submission.submitted_by) || '';
        }

        return {
          ...submission,
          submitter_name: submitter_name || undefined,
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
      // Proxy submission fields
      submitted_on_behalf_of?: string;
      submitted_by_admin?: string;
      submission_type?: 'self_submitted' | 'admin_on_behalf';
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
            submitted_at: submissionData.status === 'completed' ? new Date().toISOString() : undefined,
            submitted_on_behalf_of: submissionData.submitted_on_behalf_of || null,
            submitted_by_admin: submissionData.submitted_by_admin || null,
            submission_type: submissionData.submission_type || 'self_submitted',
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
            submitted_on_behalf_of: submissionData.submitted_on_behalf_of || null,
            submitted_by_admin: submissionData.submitted_by_admin || null,
            submission_type: submissionData.submission_type || 'self_submitted',
          }])
          .select()
          .single();

        if (error) throw error;
        return { data, isUpdate: false };
      }
    },
    onSuccess: async (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['form-submissions', branchId] });
      queryClient.invalidateQueries({ queryKey: ['my-assigned-forms'] });
      
      const isDraft = variables.status === 'draft';
      const isUpdate = result.isUpdate;
      
      if (!isDraft) {
        toast({
          title: "Success",
          description: isUpdate ? "Form updated and submitted successfully" : "Form submitted successfully",
        });

        // Trigger admin notification for completed submissions
        try {
          // Get form details
          const { data: formData } = await supabase
            .from('forms')
            .select('title, branch_id')
            .eq('id', variables.form_id)
            .single();

          // Get submitter name based on type
          let submitterName = 'Unknown User';
          if (variables.submitted_by_type === 'client') {
            const { data: client } = await supabase
              .from('clients')
              .select('first_name, last_name')
              .eq('auth_user_id', variables.submitted_by)
              .single();
            submitterName = client ? `${client.first_name || ''} ${client.last_name || ''}`.trim() : 'A client';
          } else {
            const { data: staff } = await supabase
              .from('staff')
              .select('first_name, last_name')
              .eq('auth_user_id', variables.submitted_by)
              .single();
            submitterName = staff ? `${staff.first_name || ''} ${staff.last_name || ''}`.trim() : 'A staff member';
          }

          if (formData) {
            console.log('[useFormSubmissions] Triggering form submission notification');
            await supabase.functions.invoke('create-form-submission-notifications', {
              body: {
                form_id: variables.form_id,
                form_title: formData.title,
                submitter_id: variables.submitted_by,
                submitter_name: submitterName,
                submitter_type: variables.submitted_by_type,
                branch_id: formData.branch_id || branchId,
                submission_id: result.data?.id
              }
            });
          }
        } catch (notifErr) {
          console.error('[useFormSubmissions] Failed to trigger notification:', notifErr);
        }
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
