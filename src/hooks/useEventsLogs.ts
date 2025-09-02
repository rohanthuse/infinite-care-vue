import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';

export interface EventLog {
  id: string;
  client_id: string;
  title: string;
  description?: string;
  severity: string;
  category?: string;
  created_at: string;
  client_name?: string;
  created_by?: string;
}

export const useEventsLogs = () => {
  const { data: userRole } = useUserRole();

  return useQuery({
    queryKey: ['events-logs', userRole?.branchId],
    queryFn: async () => {
      if (!userRole?.branchId) {
        console.warn('No branch ID available for events logs');
        return [];
      }

      const { data, error } = await supabase
        .from('client_events_logs')
        .select(`
          *,
          clients!client_id (
            first_name,
            last_name
          )
        `)
        .eq('branch_id', userRole.branchId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching events logs:', error);
        return [];
      }

      return data?.map(event => ({
        ...event,
        client_name: event.clients 
          ? `${event.clients.first_name || ''} ${event.clients.last_name || ''}`.trim()
          : 'Unknown Client'
      })) || [];
    },
    enabled: !!userRole?.branchId,
    retry: 2,
  });
};

// Hook to get assignments (events) for the current carer
export const useCarerAssignments = () => {
  const { data: userRole } = useUserRole();

  return useQuery({
    queryKey: ['carer-assignments', userRole?.staffId, userRole?.branchId],
    queryFn: async () => {
      if (!userRole?.branchId || userRole.role !== 'carer') {
        console.warn('No branch ID or user is not a carer');
        return [];
      }

      // Get recent events assigned to this carer (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('client_events_logs')
        .select(`
          *,
          clients!client_id (
            first_name,
            last_name
          )
        `)
        .eq('branch_id', userRole.branchId)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Filter by assignments - events where this carer is assigned for follow-up, investigation, or is the recorder
      const staffId = userRole.staffId || userRole.id;
      query = query.or(`follow_up_assigned_to.eq.${staffId},recorded_by_staff_id.eq.${staffId},investigation_assigned_to.eq.${staffId}`);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching carer assignments:', error);
        return [];
      }

      return data?.map(event => ({
        ...event,
        client_name: event.clients 
          ? `${event.clients.first_name || ''} ${event.clients.last_name || ''}`.trim()
          : 'Unknown Client'
      })) || [];
    },
    enabled: !!userRole?.branchId && userRole.role === 'carer',
    retry: 2,
  });
};