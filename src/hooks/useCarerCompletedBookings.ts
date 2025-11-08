import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarerCompletedBooking {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: string;
  service_id?: string;
  clients: {
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
  services: {
    title: string;
  } | null;
  client_service_reports?: { id: string }[];
}

export const useCarerCompletedBookings = (carerId?: string) => {
  return useQuery({
    queryKey: ['carer-completed-bookings', carerId],
    queryFn: async () => {
      if (!carerId) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          client_id,
          start_time,
          end_time,
          status,
          service_id,
          clients!inner (
            first_name,
            last_name,
            email
          ),
          services (
            title
          ),
          client_service_reports!booking_id (
            id
          )
        `)
        .eq('staff_id', carerId)
        .eq('status', 'done')
        .order('start_time', { ascending: false });

      if (error) {
        console.error('[useCarerCompletedBookings] Error:', error);
        throw error;
      }
      
      // Filter out bookings that already have service reports
      const bookingsWithoutReports = (data || []).filter(booking => 
        !booking.client_service_reports || 
        booking.client_service_reports.length === 0
      );
      
      console.log('[useCarerCompletedBookings] Found', bookingsWithoutReports.length, 'completed bookings without reports');
      
      return bookingsWithoutReports;
    },
    enabled: Boolean(carerId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
