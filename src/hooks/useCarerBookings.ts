
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
  // Multiple services support
  service_ids?: string[];
  service_names?: string[];
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
  // Raw related data
  clients?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  services?: {
    id: string;
    title: string;
    description?: string;
  };
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
        title,
        description
      ),
      booking_unavailability_requests!booking_id (
        id,
        status,
        reason,
        notes,
        requested_at,
        reviewed_at,
        admin_notes
      ),
      booking_services (
        service_id,
        services (
          id,
          title
        )
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
    
    // Get service names from junction table first, fallback to single service
    const bookingServices = booking.booking_services || [];
    const serviceNames = bookingServices
      .map((bs: any) => bs.services?.title)
      .filter(Boolean);
    const serviceIds = bookingServices.map((bs: any) => bs.service_id);
    
    // Use junction table services if available, otherwise fallback to single service
    const serviceName = serviceNames.length > 0 
      ? serviceNames.join(', ')
      : (booking.services?.title || 'No Service Selected');
    
    // Get the most recent unavailability request for this booking
    const unavailabilityRequest = booking.booking_unavailability_requests?.[0] || null;
    
    return {
      ...booking,
      client_name: clientName,
      service_name: serviceName,
      service_ids: serviceIds.length > 0 ? serviceIds : (booking.service_id ? [booking.service_id] : []),
      service_names: serviceNames.length > 0 ? serviceNames : (booking.services?.title ? [booking.services.title] : []),
      client_first_name: booking.clients?.first_name || '',
      client_last_name: booking.clients?.last_name || '',
      unavailability_request: unavailabilityRequest
    };
  });
};

export const useCarerBookings = (carerId?: string) => {
  return useQuery({
    queryKey: ['carer-bookings', carerId],
    queryFn: () => carerId ? fetchCarerBookings(carerId) : Promise.resolve([]),
    enabled: Boolean(carerId),
    staleTime: 30 * 1000, // 30 seconds - ensure fresh data
    refetchOnMount: true, // Always refetch on mount
  });
};
