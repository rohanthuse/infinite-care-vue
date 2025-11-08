import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useClientCompletedBookings = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-completed-bookings', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          services:service_id (
            title
          ),
          staff:staff_id (
            id,
            first_name,
            last_name
          ),
          client_service_reports!booking_id (
            id
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'done')
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      // Filter out bookings that already have service reports
      return (data || []).filter(booking => 
        !booking.client_service_reports || 
        booking.client_service_reports.length === 0
      );
    },
    enabled: Boolean(clientId),
  });
};
