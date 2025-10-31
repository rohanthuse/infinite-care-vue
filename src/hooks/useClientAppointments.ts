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
    onSuccess: async (data, variables) => {
      console.log('✅ Appointment creation successful:', data);
      
      // Invalidate all relevant caches for real-time sync across all views
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      // CRITICAL: Force immediate refetch to ensure calendar updates
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Also invalidate stats queries
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar-stats'],
        exact: false
      });
      
      console.log('✅ Calendar refetched after meeting creation');
      
      // Invalidate client appointments if this was a client meeting
      if (variables.client_id) {
        queryClient.invalidateQueries({ queryKey: ['client-appointments', variables.client_id] });
      }
      
      // Invalidate staff meetings if staff ID is in notes
      const staffIdMatch = variables.notes?.match(/Staff ID: ([a-f0-9-]+)/);
      if (staffIdMatch && staffIdMatch[1]) {
        queryClient.invalidateQueries({ queryKey: ['staff-meetings', staffIdMatch[1]] });
      }
      
      // Also invalidate all staff meetings cache to ensure comprehensive sync
      queryClient.invalidateQueries({ queryKey: ['staff-meetings'] });
      
      // Success toast with date confirmation
      toast.success(
        `Meeting scheduled for ${variables.appointment_date}`,
        {
          description: `Time: ${variables.appointment_time} - View it in the calendar`,
        }
      );
    },
    onError: (error) => {
      console.error('Error creating appointment:', error);
      toast.error(`Failed to schedule meeting: ${error.message}`);
    }
  });
};

// Hook to fetch single appointment by ID
export const useClientAppointment = (appointmentId: string) => {
  return useQuery({
    queryKey: ['client-appointment', appointmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_appointments')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          ),
          branches (
            id,
            name
          )
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!appointmentId
  });
};

// Hook to update appointment
export const useUpdateClientAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      appointmentId, 
      updates 
    }: { 
      appointmentId: string; 
      updates: Partial<CreateClientAppointment> 
    }) => {
      const { data, error } = await supabase
        .from('client_appointments')
        .update(updates)
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: async (data, variables) => {
      // Invalidate all calendar queries
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      // Invalidate specific appointment
      queryClient.invalidateQueries({ 
        queryKey: ['client-appointment', variables.appointmentId] 
      });
      
      // Invalidate staff meetings if staff is involved
      const staffIdMatch = data.notes?.match(/Staff ID: ([a-f0-9-]+)/);
      if (staffIdMatch && staffIdMatch[1]) {
        queryClient.invalidateQueries({ 
          queryKey: ['staff-meetings', staffIdMatch[1]] 
        });
      }
      
      toast.success('Meeting updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update meeting: ${error.message}`);
    }
  });
};

// Hook to delete appointment
export const useDeleteClientAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { error } = await supabase
        .from('client_appointments')
        .delete()
        .eq('id', appointmentId);

      if (error) throw error;
      return appointmentId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false
      });
      
      await queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
      
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
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