
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
    .from('client_appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false });

  if (error) {
    console.error('Error fetching client appointments:', error);
    throw error;
  }

  return data || [];
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
