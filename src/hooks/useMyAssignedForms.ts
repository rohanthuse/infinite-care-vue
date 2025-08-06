import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AssignedForm {
  id: string;
  title: string;
  description?: string;
  status: string;
  published: boolean;
  requires_review: boolean;
  assigned_at: string;
  assigned_by: string;
  assignee_type: string;
  assignee_name: string;
  submission_status?: 'not_submitted' | 'completed' | 'under_review';
  submitted_at?: string;
  reviewed_at?: string;
}

const fetchMyAssignedForms = async (userId: string, userType: 'client' | 'carer' | 'staff'): Promise<AssignedForm[]> => {
  if (!userId || !userType) {
    return [];
  }

  // Query form_assignees to get forms assigned to this user
  const { data: assignees, error: assigneesError } = await supabase
    .from('form_assignees')
    .select(`
      id,
      form_id,
      assigned_at,
      assigned_by,
      assignee_type,
      assignee_name,
      forms!inner (
        id,
        title,
        description,
        status,
        published,
        requires_review
      )
    `)
    .eq('assignee_id', userId)
    .eq('assignee_type', userType);

  if (assigneesError) {
    console.error('Error fetching assigned forms:', assigneesError);
    throw assigneesError;
  }

  if (!assignees || assignees.length === 0) {
    return [];
  }

  // Get form IDs to check for submissions
  const formIds = assignees.map(a => a.form_id);
  
  // Query form_submissions to check submission status
  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('form_id, status, submitted_at, reviewed_at')
    .in('form_id', formIds)
    .eq('submitted_by', userId);

  // Create a map of form submissions
  const submissionMap = new Map();
  submissions?.forEach(sub => {
    submissionMap.set(sub.form_id, {
      submission_status: sub.status,
      submitted_at: sub.submitted_at,
      reviewed_at: sub.reviewed_at
    });
  });

  // Combine the data
  return assignees.map(assignee => {
    const form = (assignee as any).forms;
    const submission = submissionMap.get(assignee.form_id);
    
    return {
      id: form.id,
      title: form.title,
      description: form.description,
      status: form.status,
      published: form.published,
      requires_review: form.requires_review,
      assigned_at: assignee.assigned_at,
      assigned_by: assignee.assigned_by,
      assignee_type: assignee.assignee_type,
      assignee_name: assignee.assignee_name,
      submission_status: submission?.submission_status || 'not_submitted',
      submitted_at: submission?.submitted_at,
      reviewed_at: submission?.reviewed_at
    };
  });
};

export const useMyAssignedForms = (userId: string, userType: 'client' | 'carer' | 'staff') => {
  return useQuery({
    queryKey: ['my-assigned-forms', userId, userType],
    queryFn: () => fetchMyAssignedForms(userId, userType),
    enabled: Boolean(userId && userType),
  });
};