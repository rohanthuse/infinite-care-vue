import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface AssignedClient {
  id: string;
  first_name: string;
  last_name: string;
  address?: string;
}

export const useCarerAssignedClients = () => {
  const { data: carerProfile } = useCarerProfile();

  return useQuery({
    queryKey: ['carer-assigned-clients', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Get unique client IDs from recent bookings for this carer
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('client_id')
        .eq('staff_id', carerProfile.id)
        .not('client_id', 'is', null)
        .order('start_time', { ascending: false })
        .limit(100);

      if (bookingsError) throw bookingsError;

      // Get unique client IDs
      const clientIds = [...new Set(bookings?.map(b => b.client_id).filter(Boolean))];

      if (clientIds.length === 0) {
        return [];
      }

      // Fetch client details
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, address')
        .in('id', clientIds)
        .eq('status', 'active');

      if (clientsError) throw clientsError;

      return (clients || []) as AssignedClient[];
    },
    enabled: !!carerProfile?.id,
  });
};
