
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

  console.log('Fetching assigned forms for:', { userId, userType });

  // For carers/staff, we need to get the staff database ID from auth_user_id
  let assigneeId = userId;
  if (userType === 'carer' || userType === 'staff') {
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('auth_user_id', userId)
      .single();

    if (staffError) {
      console.error('Error fetching staff record:', staffError);
      throw staffError;
    }

    if (!staffData) {
      console.log('No staff record found for auth user:', userId);
      return [];
    }

    assigneeId = staffData.id;
    console.log('Found staff database ID:', assigneeId);
  }

  // Query form_assignees to get forms assigned to this user
  // For carers, we need to check both 'carer' and 'staff' assignee types
  const assigneeTypes = userType === 'carer' ? ['carer', 'staff'] : [userType];
  
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
    .eq('assignee_id', assigneeId)
    .in('assignee_type', assigneeTypes);

  if (assigneesError) {
    console.error('Error fetching assigned forms:', assigneesError);
    throw assigneesError;
  }

  console.log('Found assigned forms:', assignees);

  if (!assignees || assignees.length === 0) {
    return [];
  }

  // Get form IDs to check for submissions
  const formIds = assignees.map(a => a.form_id);
  
  // Query form_submissions to check submission status
  // Use auth.uid() for the submission check since form_submissions.submitted_by stores auth user IDs
  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('form_id, status, submitted_at, reviewed_at')
    .in('form_id', formIds)
    .eq('submitted_by', userId); // userId is the auth user ID

  console.log('Found submissions:', submissions);

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
