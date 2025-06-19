
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfile } from './useClientData';
import { useCarerAuth } from './useCarerAuth';

// Hook for carers to get their assigned clients
export const useCarerClients = () => {
  const { user } = useCarerAuth();

  return useQuery({
    queryKey: ['carer-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useCarerClients] Fetching clients for carer:', user.id);

      // Get clients assigned to this carer through bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          client_id,
          clients (*)
        `)
        .eq('staff_id', user.id);

      if (bookingsError) {
        console.error('[useCarerClients] Bookings error:', bookingsError);
        throw bookingsError;
      }

      // Extract unique clients from bookings
      const uniqueClients = bookings?.reduce((acc: ClientProfile[], booking: any) => {
        const client = booking.clients;
        if (client && !acc.find(c => c.id === client.id)) {
          acc.push(client);
        }
        return acc;
      }, []) || [];

      console.log('[useCarerClients] Found clients:', uniqueClients.length);
      return uniqueClients;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for carers to get specific client details they're assigned to
export const useCarerClientDetail = (clientId: string) => {
  const { user } = useCarerAuth();

  return useQuery({
    queryKey: ['carer-client-detail', clientId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useCarerClientDetail] Fetching client detail:', clientId);

      // Verify carer has access to this client through bookings
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('staff_id', user.id)
        .eq('client_id', clientId)
        .limit(1)
        .single();

      if (bookingError && bookingError.code !== 'PGRST116') {
        console.error('[useCarerClientDetail] Booking verification error:', bookingError);
        throw new Error('Access denied: You are not assigned to this client');
      }

      if (!booking) {
        throw new Error('Access denied: You are not assigned to this client');
      }

      // Get client details
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientError) {
        console.error('[useCarerClientDetail] Client error:', clientError);
        throw clientError;
      }

      console.log('[useCarerClientDetail] Client detail retrieved');
      return client;
    },
    enabled: !!(clientId && user?.id),
  });
};

// Hook for carers to update assigned client data (limited updates)
export const useCarerUpdateClient = () => {
  const queryClient = useQueryClient();
  const { user } = useCarerAuth();

  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: Partial<ClientProfile> }) => {
      if (!user?.id) throw new Error('No authenticated user');

      console.log('[useCarerUpdateClient] Updating client:', clientId);

      // Verify carer has access to this client
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('staff_id', user.id)
        .eq('client_id', clientId)
        .limit(1)
        .single();

      if (bookingError && bookingError.code !== 'PGRST116') {
        throw new Error('Access denied: You are not assigned to this client');
      }

      if (!booking) {
        throw new Error('Access denied: You are not assigned to this client');
      }

      // Allow only limited updates (e.g., preferences, notes)
      const allowedUpdates = {
        additional_information: updates.additional_information,
      };

      const { data, error } = await supabase
        .from('clients')
        .update(allowedUpdates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        console.error('[useCarerUpdateClient] Update error:', error);
        throw error;
      }

      console.log('[useCarerUpdateClient] Client updated');
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['carer-clients'] });
      queryClient.invalidateQueries({ queryKey: ['carer-client-detail', data.id] });
    },
  });
};
