import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateClientAppointment {
  client_id: string | null;
  branch_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  provider_name: string;
  location: string;
  status: string;
  notes?: string;
}

export const useCreateClientAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: CreateClientAppointment) => {
      console.log('Creating appointment with data:', appointment);
      
      const { data, error } = await supabase
        .from('client_appointments')
        .insert([appointment])
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      console.log('Appointment created successfully:', data);
      return data?.[0] || data;
    },
    onSuccess: (data) => {
      console.log('Appointment creation successful:', data);
      toast.success('Meeting scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast.error(`Failed to schedule meeting: ${error.message}`);
    }
  });
};

// Placeholder hooks for backwards compatibility
export const useClientAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-appointments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_appointments')
        .select('*')
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });
};

export const useCompletedAppointments = (clientId?: string) => {
  return useQuery({
    queryKey: ['completed-appointments', clientId],
    queryFn: async () => {
      let query = supabase
        .from('client_appointments')
        .select('*')
        .eq('status', 'completed');
      
      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    }
  });
};