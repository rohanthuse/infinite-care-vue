import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
      services:service_id (
        title
      ),
      staff:staff_id (
        first_name,
        last_name
      )
    `)
    .eq('client_id', clientId)
    .order('start_time', { ascending: true }); // Changed to ascending for chronological order

  if (error) {
    console.error('Error fetching client appointments:', error);
    throw error;
  }

  // Transform the data to match the expected ClientAppointment interface
  const transformedData: ClientAppointment[] = (data || []).map((booking: any) => {
    const startTime = new Date(booking.start_time);
    const appointmentDate = startTime.toISOString().split('T')[0]; // YYYY-MM-DD format
    // Format time properly for display (12-hour format with AM/PM)
    const appointmentTime = format(startTime, 'h:mm a');
    
    // Map booking status to appointment status
    let appointmentStatus = booking.status;
    if (booking.status === 'assigned') {
      appointmentStatus = 'confirmed';
    }

    // Get service title and provider name
    const serviceTitle = booking.services?.title || 'General Care';
    const providerName = booking.staff 
      ? `${booking.staff.first_name} ${booking.staff.last_name}`
      : 'Assigned Staff';

    return {
      id: booking.id,
      appointment_type: serviceTitle,
      provider_name: providerName,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      location: 'Home Visit', // Default location - could be enhanced with actual location data
      status: appointmentStatus,
      notes: undefined, // Notes not available in bookings table
      client_id: booking.client_id,
      staff_id: booking.staff_id,
      created_at: booking.created_at,
      updated_at: booking.created_at // Using created_at as fallback for updated_at
    };
  });

  return transformedData;
};

export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: () => fetchClientAppointments(clientId),
    enabled: Boolean(clientId),
  });
};

// Hook to get completed appointments specifically
export const useCompletedAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['completed-appointments', clientId],
    queryFn: async () => {
      const appointments = await fetchClientAppointments(clientId);
      return appointments.filter(appointment => appointment.status === 'completed');
    },
    enabled: Boolean(clientId),
  });
};
