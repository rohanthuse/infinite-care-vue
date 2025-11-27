import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FormSubmission } from './useFormSubmissions';

export interface FormSubmissionWithDetails extends FormSubmission {
  form_title: string;
  form_requires_review: boolean;
}

export const useAllFormSubmissions = (branchId: string) => {
  const { data: submissions = [], isLoading, error } = useQuery({
    queryKey: ['all-form-submissions', branchId],
    queryFn: async () => {
      console.log('[useAllFormSubmissions] Fetching submissions for branch:', branchId);

      // Fetch all submissions for this branch with form details
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms:form_id (
            title,
            requires_review
          )
        `)
        .eq('branch_id', branchId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('[useAllFormSubmissions] Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      console.log('[useAllFormSubmissions] Raw submissions data:', submissionsData);

      // Fetch submitter names - need to check both clients and staff tables
      const submitterIds = submissionsData?.map(s => s.submitted_by) || [];
      
      // Fetch client names
      const { data: clients } = await supabase
        .from('clients')
        .select('id, auth_user_id, first_name, last_name')
        .in('auth_user_id', submitterIds);

      // Fetch staff names
      const { data: staff } = await supabase
        .from('staff')
        .select('id, auth_user_id, first_name, last_name')
        .in('auth_user_id', submitterIds);

      // Create name lookup maps
      const clientNames = new Map(
        clients?.map(c => [c.auth_user_id, `${c.first_name} ${c.last_name}`]) || []
      );
      
      const staffNames = new Map(
        staff?.map(s => [s.auth_user_id, `${s.first_name} ${s.last_name}`]) || []
      );

      // Combine and resolve submitter names
      const enrichedSubmissions: FormSubmissionWithDetails[] = submissionsData?.map(submission => {
        let submitterName = 'Unknown';
        
        // Try client names first
        if (clientNames.has(submission.submitted_by)) {
          submitterName = clientNames.get(submission.submitted_by) || 'Unknown';
        } 
        // Then try staff names
        else if (staffNames.has(submission.submitted_by)) {
          submitterName = staffNames.get(submission.submitted_by) || 'Unknown';
        }

        // Handle form details (Supabase returns single object for one-to-one)
        const formDetails = Array.isArray(submission.forms) 
          ? submission.forms[0] 
          : submission.forms;

        return {
          ...submission,
          submitter_name: submitterName,
          form_title: formDetails?.title || 'Unknown Form',
          form_requires_review: formDetails?.requires_review || false,
        } as FormSubmissionWithDetails;
      }) || [];

      console.log('[useAllFormSubmissions] Enriched submissions:', enrichedSubmissions);
      return enrichedSubmissions;
    },
    enabled: !!branchId,
  });

  return {
    submissions,
    isLoading,
    error,
  };
};
