
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClient } from '@/contexts/ClientContext';
import { useToast } from '@/components/ui/use-toast';

export interface ClientAppointment {
  id: string;
  appointment_type: string;
  provider_name: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  status: string;
  notes?: string;
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { client } = useClient();
  const { toast } = useToast();

  const fetchAppointments = async () => {
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_appointments')
        .select('*')
        .eq('client_id', client.id)
        .order('appointment_date', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive"
        });
        return;
      }

      setAppointments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [client]);

  const getUpcomingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date >= today);
  };

  const getPastAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointment_date < today);
  };

  return {
    appointments,
    loading,
    upcomingAppointments: getUpcomingAppointments(),
    pastAppointments: getPastAppointments(),
    refetch: fetchAppointments
  };
};
