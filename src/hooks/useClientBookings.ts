
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
  service_title?: string;
  staff_first_name?: string;
  staff_last_name?: string;
  // Multiple services support
  service_ids?: string[];
  service_names?: string[];
  // Request statuses
  cancellation_request_status?: string;
  reschedule_request_status?: string;
}

const fetchClientBookings = async (clientId: string): Promise<ClientBooking[]> => {
  console.log('[fetchClientBookings] Fetching bookings for client:', clientId);
  
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      staff (
        id,
        first_name,
        last_name
      ),
      services (
        id,
        title
      ),
      booking_services (
        service_id,
        services (
          id,
          title
        )
      )
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[fetchClientBookings] Error:', error);
    throw error;
  }
  
  console.log('[fetchClientBookings] Raw data:', data);
  
  return (data || []).map(booking => {
    const staffName = booking.staff 
      ? `${booking.staff.first_name} ${booking.staff.last_name}` 
      : 'Staff Not Assigned';
    
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
    
    return {
      ...booking,
      staff_name: staffName,
      service_name: serviceName,
      service_title: serviceName,
      service_ids: serviceIds.length > 0 ? serviceIds : (booking.service_id ? [booking.service_id] : []),
      service_names: serviceNames.length > 0 ? serviceNames : (booking.services?.title ? [booking.services.title] : []),
      staff_first_name: booking.staff?.first_name || '',
      staff_last_name: booking.staff?.last_name || ''
    };
  });
};

export const useClientBookings = (clientId: string) => {
  return useQuery({
    queryKey: ['client-bookings', clientId],
    queryFn: () => fetchClientBookings(clientId),
    enabled: Boolean(clientId),
  });
};
