import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EventLog } from '@/data/hooks/useEventsLogs';

export const useEventDetails = (eventId: string | null) => {
  return useQuery({
    queryKey: ['event-details', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await supabase
        .from('client_events_logs')
        .select(`
          *,
          clients!inner(
            first_name,
            last_name,
            branch_id
          ),
          staff:recorded_by_staff_id(
            first_name,
            last_name
          ),
          follow_up_staff:follow_up_assigned_to(
            first_name,
            last_name
          ),
          investigation_staff:investigation_assigned_to(
            first_name,
            last_name
          ),
          branches!branch_id(
            name
          )
        `)
        .eq('id', eventId)
        .single();
      
      if (error) {
        console.error('Error fetching event details:', error);
        throw error;
      }

      // Transform the data to include resolved names
      return {
        ...data,
        client_name: data.clients 
          ? `${data.clients.first_name} ${data.clients.last_name}` 
          : 'Unknown Client',
        recorded_by_staff_name: data.staff 
          ? `${data.staff.first_name} ${data.staff.last_name}` 
          : 'Unknown Staff',
        branch_name: data.branches?.name || 'Unknown Branch'
      } as EventLog;
    },
    enabled: !!eventId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
    retry: 2,
  });
};
