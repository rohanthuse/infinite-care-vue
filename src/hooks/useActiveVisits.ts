import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerAuth } from './useCarerAuth';

export interface ActiveVisit {
  id: string;
  booking_id: string;
  client_id: string;
  visit_start_time: string;
  status: string;
  client_name: string;
  service_name: string;
  start_time: string;
  end_time: string;
}

export const useActiveVisits = () => {
  const { user } = useCarerAuth();

  return useQuery({
    queryKey: ['active-visits', user?.id],
    queryFn: async (): Promise<ActiveVisit[]> => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          staff_id,
          start_time,
          end_time,
          client_id,
          clients (
            first_name,
            last_name
          ),
          services (
            title
          ),
          visit_records!inner (
            id,
            visit_start_time,
            status
          )
        `)
        .eq('staff_id', user.id)
        .eq('visit_records.status', 'in_progress');

      if (error) {
        console.error('Error fetching active visits:', error);
        return [];
      }

      return (data || []).map((booking: any) => {
        const visitRecord = Array.isArray(booking.visit_records) ? booking.visit_records[0] : booking.visit_records;
        
        return {
          id: visitRecord?.id || '',
          booking_id: booking.id,
          client_id: booking.client_id,
          visit_start_time: visitRecord?.visit_start_time || '',
          status: visitRecord?.status || '',
          client_name: `${booking.clients?.first_name || ''} ${booking.clients?.last_name || ''}`.trim(),
          service_name: booking.services?.title || 'Service',
          start_time: booking.start_time || '',
          end_time: booking.end_time || '',
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};