
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientBooking {
  id: string;
  client_id: string;
  staff_id: string;
  branch_id: string;
  start_time: string;
  end_time: string;
  service_id?: string;
  revenue?: number;
  status: string;
  created_at: string;
  // Extended fields for display
  staff_name?: string;
  service_name?: string;
}

const fetchClientBookings = async (clientId: string): Promise<ClientBooking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      staff:staff_id (
        first_name,
        last_name
      ),
      service:services (
        title
      )
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(booking => ({
    ...booking,
    staff_name: booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unknown Staff',
    service_name: booking.service?.title || 'General Service'
  }));
};

export const useClientBookings = (clientId: string) => {
  return useQuery({
    queryKey: ['client-bookings', clientId],
    queryFn: () => fetchClientBookings(clientId),
    enabled: Boolean(clientId),
  });
};
