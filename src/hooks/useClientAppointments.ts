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

// Hook to fetch all appointments (external + care bookings)
export const useClientAllAppointments = (clientId: string) => {
  return useQuery({
    queryKey: ['client-all-appointments', clientId],
    queryFn: async () => {
      console.log('[useClientAllAppointments] Fetching all appointments for client:', clientId);
      
      // Fetch external appointments from client_appointments table
      const { data: externalAppointments, error: externalError } = await supabase
        .from('client_appointments')
        .select('*')
        .eq('client_id', clientId);
      
      if (externalError) {
        console.error('[useClientAllAppointments] Error fetching external appointments:', externalError);
      }
      
      // Fetch care bookings from bookings table
      const { data: careBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          services (
            id,
            title
          ),
          staff (
            id,
            first_name,
            last_name
          ),
          branches (
            id,
            name
          )
        `)
        .eq('client_id', clientId);
      
      if (bookingsError) {
        console.error('[useClientAllAppointments] Error fetching care bookings:', bookingsError);
      }
      
      // Transform care bookings to match appointment format
      const transformedBookings = (careBookings || []).map(booking => {
        const startTime = new Date(booking.start_time);
        const staffName = booking.staff 
          ? `${booking.staff.first_name} ${booking.staff.last_name}`.trim()
          : 'Unassigned';
        
        return {
          id: booking.id,
          client_id: booking.client_id,
          branch_id: booking.branch_id,
          appointment_date: startTime.toISOString().split('T')[0],
          appointment_time: startTime.toTimeString().slice(0, 5),
          appointment_type: booking.services?.title || 'Care Service',
          provider_name: staffName,
          location: booking.branches?.name || 'Branch Location',
          status: booking.status || 'scheduled',
          notes: booking.notes || null,
          created_at: booking.created_at,
          updated_at: booking.created_at,
          _source: 'booking',
          _booking_data: {
            service_id: booking.service_id,
            staff_id: booking.staff_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            revenue: booking.revenue
          }
        };
      });
      
      // Mark external appointments with source
      const markedExternalAppointments = (externalAppointments || []).map(apt => ({
        ...apt,
        _source: 'external'
      }));
      
      // Combine both arrays
      const allAppointments = [
        ...markedExternalAppointments,
        ...transformedBookings
      ];
      
      // Sort by date and time
      allAppointments.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date}T${b.appointment_time}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      console.log('[useClientAllAppointments] Combined appointments:', {
        external: markedExternalAppointments.length,
        careBookings: transformedBookings.length,
        total: allAppointments.length
      });
      
      return allAppointments;
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2
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