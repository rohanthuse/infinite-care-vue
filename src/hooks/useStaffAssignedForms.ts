import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffFormAssignment {
  staff_id: string;
  staff_name: string;
  staff_auth_id: string;
  form_id: string;
  form_title: string;
  assigned_at: string;
  assignment_id: string;
  submission_status: 'not_submitted' | 'draft' | 'completed' | 'under_review' | 'approved' | 'rejected';
  submitted_at?: string;
  submitted_by_admin?: boolean;
  admin_name?: string;
}

/**
 * Fetches all forms assigned to staff members in a branch
 * Optionally filters by specific staff member
 */
export const useStaffAssignedForms = (branchId: string, staffId?: string) => {
  return useQuery({
    queryKey: ['staff-assigned-forms', branchId, staffId],
    queryFn: async (): Promise<StaffFormAssignment[]> => {
      if (!branchId) return [];

      // Get staff in the branch
      let staffQuery = supabase
        .from('staff')
        .select('id, auth_user_id, first_name, last_name, branch_id')
        .eq('branch_id', branchId);
      
      if (staffId) {
        staffQuery = staffQuery.eq('id', staffId);
      }

      const { data: staffData, error: staffError } = await staffQuery;
      if (staffError) throw staffError;
      if (!staffData || staffData.length === 0) return [];

      // Get all form assignments for these staff members
      const staffAuthIds = staffData.map(s => s.auth_user_id).filter(Boolean);
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('form_assignees')
        .select(`
          id,
          form_id,
          assignee_id,
          assignee_name,
          assigned_at,
          forms!inner (
            id,
            title,
            branch_id
          )
        `)
        .in('assignee_type', ['staff', 'carer'])
        .eq('forms.branch_id', branchId);
      
      if (assignmentsError) throw assignmentsError;
      if (!assignments) return [];

      // Get all form IDs
      const formIds = [...new Set(assignments.map(a => a.form_id))];

      // Get submissions for these forms by these staff
      const { data: submissions } = await supabase
        .from('form_submissions')
        .select('*')
        .in('form_id', formIds)
        .in('submitted_by', staffAuthIds);

      // Build a map of staff by ID
      const staffMap = new Map(
        staffData.map(s => [
          s.id,
          {
            auth_user_id: s.auth_user_id,
            name: `${s.first_name || ''} ${s.last_name || ''}`.trim()
          }
        ])
      );

      // Combine data
      const result: StaffFormAssignment[] = [];
      
      for (const assignment of assignments) {
        const staff = staffMap.get(assignment.assignee_id);
        if (!staff) continue;

        const submission = submissions?.find(
          s => s.form_id === assignment.form_id && s.submitted_by === staff.auth_user_id
        );

        result.push({
          staff_id: assignment.assignee_id,
          staff_name: assignment.assignee_name,
          staff_auth_id: staff.auth_user_id || '',
          form_id: assignment.form_id,
          form_title: (assignment.forms as any).title,
          assigned_at: assignment.assigned_at,
          assignment_id: assignment.id,
          submission_status: (submission?.status || 'not_submitted') as StaffFormAssignment['submission_status'],
          submitted_at: submission?.submitted_at,
          submitted_by_admin: !!submission?.submitted_by_admin,
          admin_name: submission?.submitted_by_admin ? 'Admin' : undefined
        });
      }

      return result;
    },
    enabled: !!branchId
  });
};
