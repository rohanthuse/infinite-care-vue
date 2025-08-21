
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientAppointment {
  id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  notes?: string;
  client_id: string;
  staff_id?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to format time from UTC timestamp without timezone conversion
const formatTimeFromUTC = (utcTimestamp: string): string => {
  const date = new Date(utcTimestamp);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  
  // Convert to 12-hour format
  let displayHours = hours;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  if (hours === 0) {
    displayHours = 12;
  } else if (hours > 12) {
    displayHours = hours - 12;
  }
  
  const formattedMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${formattedMinutes} ${ampm}`;
};

const fetchClientAppointments = async (clientId: string): Promise<ClientAppointment[]> => {
  if (!clientId) {
    console.error('[fetchClientAppointments] No client ID provided');
    return [];
  }

  console.log(`[fetchClientAppointments] Fetching appointments for client: ${clientId}`);

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      status,
      client_id,
      staff_id,
      created_at,
      revenue,
      notes,
      services:service_id (
        title
      ),
      staff:staff_id (
        first_name,
        last_name
      )
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('[fetchClientAppointments] Error fetching client appointments:', error);
    throw error;
  }

  console.log(`[fetchClientAppointments] Raw booking data for client ${clientId}:`, data);

  // Transform the data to match the expected ClientAppointment interface
  const transformedData: ClientAppointment[] = (data || []).map((booking: any) => {
    const startTime = new Date(booking.start_time);
    const appointmentDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    // Use our custom function to format time without timezone conversion
    const appointmentTime = formatTimeFromUTC(booking.start_time);
    
    // Map booking status to appointment status - handle various status values
    let appointmentStatus = booking.status || 'confirmed';
    if (booking.status === 'assigned') {
      appointmentStatus = 'confirmed';
    }

    // Get service title and provider name
    const serviceTitle = booking.services?.title || 'General Care';
    const providerName = booking.staff 
      ? `${booking.staff.first_name} ${booking.staff.last_name}`
      : 'Assigned Staff';

    const transformedAppointment = {
      id: booking.id,
      appointment_type: serviceTitle,
      provider_name: providerName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      location: 'Home Visit', // Default location - could be enhanced with actual location data
      status: appointmentStatus,
      notes: booking.notes || undefined,
      client_id: booking.client_id,
      staff_id: booking.staff_id,
      created_at: booking.created_at,
      updated_at: booking.created_at // Using created_at as fallback for updated_at
    };

    console.log(`[fetchClientAppointments] Transformed booking ${booking.id}:`, transformedAppointment);
    
    return transformedAppointment;
  });

  console.log(`[fetchClientAppointments] Final transformed data for client ${clientId}:`, transformedData);
  return transformedData;
};

export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: () => fetchClientAppointments(clientId),
    enabled: Boolean(clientId),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });
};

// Hook to get completed appointments specifically
export const useCompletedAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['completed-appointments', clientId],
    queryFn: async () => {
      const appointments = await fetchClientAppointments(clientId);
      return appointments.filter(appointment => 
        ['completed', 'done'].includes(appointment.status.toLowerCase())
      );
    },
    enabled: Boolean(clientId),
  });
};
