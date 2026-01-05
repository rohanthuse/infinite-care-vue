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
      console.log('[useCarerCompletedBookings] START - carerId:', carerId);
      
      if (!carerId) {
        console.log('[useCarerCompletedBookings] No carerId provided, returning empty array');
        return [];
      }
      
      console.log('[useCarerCompletedBookings] Fetching completed bookings for carer:', carerId);
      
      try {
        // Try the main query with LEFT JOINs (removed !inner)
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            client_id,
            start_time,
            end_time,
            status,
            service_id,
            clients (
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
          .in('status', ['done', 'completed', 'missed', 'in_progress', 'in-progress'])
          .order('start_time', { ascending: false });

        console.log('[useCarerCompletedBookings] Query result:', { 
          dataLength: data?.length || 0, 
          error: error ? error.message : null,
          sampleData: data?.[0] 
        });

        if (error) {
          console.error('[useCarerCompletedBookings] Query error:', error);
          
          // Fallback: Try simpler query without joins
          console.log('[useCarerCompletedBookings] Trying fallback query without joins...');
          const { data: simpleData, error: simpleError } = await supabase
            .from('bookings')
            .select('id, client_id, start_time, end_time, status, service_id')
            .eq('staff_id', carerId)
            .in('status', ['done', 'completed', 'missed', 'in_progress', 'in-progress'])
            .order('start_time', { ascending: false });
          
          if (simpleError) {
            console.error('[useCarerCompletedBookings] Fallback query also failed:', simpleError);
            throw simpleError;
          }
          
          console.log('[useCarerCompletedBookings] Fallback query returned', simpleData?.length || 0, 'bookings');
          
          // Manually fetch client and service data
          const enrichedData = await Promise.all(
            (simpleData || []).map(async (booking) => {
              const [clientRes, serviceRes, reportRes] = await Promise.all([
                supabase.from('clients').select('first_name, last_name, email').eq('id', booking.client_id).maybeSingle(),
                booking.service_id 
                  ? supabase.from('services').select('title').eq('id', booking.service_id).maybeSingle()
                  : Promise.resolve({ data: null }),
                supabase.from('client_service_reports').select('id').eq('booking_id', booking.id)
              ]);
              
              return {
                ...booking,
                clients: clientRes.data,
                services: serviceRes.data,
                client_service_reports: reportRes.data || []
              };
            })
          );
          
          const filteredFallback = enrichedData.filter(booking => 
            !booking.client_service_reports || 
            booking.client_service_reports.length === 0
          );
          
          console.log('[useCarerCompletedBookings] Fallback found', filteredFallback.length, 'bookings without reports');
          return filteredFallback;
        }
        
        // Filter out bookings that already have service reports
        const bookingsWithoutReports = (data || []).filter(booking => 
          !booking.client_service_reports || 
          booking.client_service_reports.length === 0
        );
        
        console.log('[useCarerCompletedBookings] Found', bookingsWithoutReports.length, 'completed bookings without reports');
        console.log('[useCarerCompletedBookings] Sample booking:', bookingsWithoutReports[0]);
        
        return bookingsWithoutReports;
      } catch (err) {
        console.error('[useCarerCompletedBookings] Unexpected error:', err);
        throw err;
      }
    },
    enabled: Boolean(carerId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
