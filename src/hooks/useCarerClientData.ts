
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfile } from './useClientData';
import { useCarerContext } from './useCarerContext';

// Hook for carers to get their assigned clients
export const useCarerClients = () => {
  const { data: carerContext } = useCarerContext();

  return useQuery({
    queryKey: ['carer-clients', carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) throw new Error('No carer context available');

      console.log('[useCarerClients] Fetching clients for staff ID:', carerContext.staffId);

      // Get clients assigned to this carer through bookings using staff record ID
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          client_id,
          clients (*)
        `)
        .eq('staff_id', carerContext.staffId);

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
    enabled: !!carerContext?.staffId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook for carers to get specific client details they're assigned to
export const useCarerClientDetail = (clientId: string) => {
  const { data: carerContext } = useCarerContext();

  return useQuery({
    queryKey: ['carer-client-detail', clientId, carerContext?.staffId],
    queryFn: async () => {
      if (!carerContext?.staffId) throw new Error('No carer context available');

      console.log('[useCarerClientDetail] Fetching client detail:', clientId);

      // Verify carer has access to this client through bookings
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('staff_id', carerContext.staffId)
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();

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
        .maybeSingle();

      if (clientError) {
        console.error('[useCarerClientDetail] Client error:', clientError);
        throw clientError;
      }

      console.log('[useCarerClientDetail] Client detail retrieved');
      return client;
    },
    enabled: !!(clientId && carerContext?.staffId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for carers to update assigned client data (limited updates)
export const useCarerUpdateClient = () => {
  const queryClient = useQueryClient();
  const { data: carerContext } = useCarerContext();

  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: Partial<ClientProfile> }) => {
      if (!carerContext?.staffId) throw new Error('No carer context available');

      console.log('[useCarerUpdateClient] Updating client:', clientId);

      // Verify carer has access to this client
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('staff_id', carerContext.staffId)
        .eq('client_id', clientId)
        .limit(1)
        .maybeSingle();

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
        .maybeSingle();

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
