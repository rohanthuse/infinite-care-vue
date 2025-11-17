
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarerBooking {
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
  client_name?: string;
  service_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  // Unavailability request data
  unavailability_request?: {
    id: string;
    status: string;
    reason: string;
    notes?: string;
    requested_at: string;
    reviewed_at?: string;
    admin_notes?: string;
  } | null;
}

const fetchCarerBookings = async (carerId: string): Promise<CarerBooking[]> => {
  console.log('[fetchCarerBookings] Fetching bookings for carer:', carerId);
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      clients (
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      services (
        id,
        title
      ),
      booking_unavailability_requests!booking_id (
        id,
        status,
        reason,
        notes,
        requested_at,
        reviewed_at,
        admin_notes
      )
    `)
    .eq('staff_id', carerId)
    .order('start_time', { ascending: false });

  if (error) {
    console.error('[fetchCarerBookings] Error:', error);
    throw error;
  }
  
  console.log('[fetchCarerBookings] Raw data:', data);
  
  return (data || []).map(booking => {
    const clientName = booking.clients 
      ? `${booking.clients.first_name} ${booking.clients.last_name}` 
      : 'Client Not Found';
    
    const serviceName = booking.services?.title || 'No Service Selected';
    
    // Get the most recent unavailability request for this booking
    const unavailabilityRequest = booking.booking_unavailability_requests?.[0] || null;
    
    return {
      ...booking,
      client_name: clientName,
      service_name: serviceName,
      client_first_name: booking.clients?.first_name || '',
      client_last_name: booking.clients?.last_name || '',
      unavailability_request: unavailabilityRequest
    };
  });
};

export const useCarerBookings = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-bookings', carerId],
    queryFn: () => fetchCarerBookings(carerId),
    enabled: Boolean(carerId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
