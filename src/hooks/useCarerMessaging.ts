import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuthSafe } from "@/hooks/useCarerAuthSafe";

export interface MessageContact {
  id: string;
  name: string;
  auth_user_id: string;
  branch_id: string;
  organization_id: string;
}

export const useCarerMessageContacts = () => {
  const { carerProfile } = useCarerAuthSafe();
  
  return useQuery({
    queryKey: ['carer-message-contacts', carerProfile?.id],
    queryFn: async (): Promise<MessageContact[]> => {
      if (!carerProfile?.id) {
        throw new Error('No carer context available');
      }

      try {
        // First get client IDs from bookings
        const bookingsResponse = await (supabase as any)
          .from('bookings')
          .select('client_id')
          .eq('carer_id', carerProfile.id)
          .eq('status', 'active');

        if (bookingsResponse.error) {
          console.error('Error fetching client bookings:', bookingsResponse.error);
          throw bookingsResponse.error;
        }

        if (!bookingsResponse.data || bookingsResponse.data.length === 0) {
          return [];
        }

        // Get unique client IDs
        const clientIds = [...new Set(bookingsResponse.data.map((b: any) => b.client_id))];

        // Now fetch client details
        const clientsResponse = await (supabase as any)
          .from('clients')
          .select('id, first_name, last_name, auth_user_id, branch_id, organization_id')
          .in('id', clientIds)
          .not('auth_user_id', 'is', null);

        if (clientsResponse.error) {
          console.error('Error fetching clients:', clientsResponse.error);
          throw clientsResponse.error;
        }

        return (clientsResponse.data || []).map((client: any) => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          auth_user_id: client.auth_user_id,
          branch_id: client.branch_id,
          organization_id: client.organization_id
        }));
      } catch (error) {
        console.error('Error in useCarerMessageContacts:', error);
        throw error;
      }
    },
    enabled: !!carerProfile?.id,
  });
};