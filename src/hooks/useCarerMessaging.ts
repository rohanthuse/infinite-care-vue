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
    queryKey: ['carer-message-contacts', carerProfile?.id, carerProfile?.branchId],
    queryFn: async (): Promise<MessageContact[]> => {
      if (!carerProfile?.id || !carerProfile?.branchId) {
        throw new Error('No carer context available');
      }

      console.log('[useCarerMessageContacts] Starting with carer:', {
        id: carerProfile.id,
        branchId: carerProfile.branchId
      });

      try {
        let clientIds: string[] = [];

        // First try to get client IDs from bookings where this carer is assigned
        const bookingsResponse = await (supabase as any)
          .from('bookings')
          .select('client_id')
          .eq('staff_id', carerProfile.id)
          .not('client_id', 'is', null);

        console.log('[useCarerMessageContacts] Bookings response:', bookingsResponse);

        if (bookingsResponse.data && bookingsResponse.data.length > 0) {
          clientIds = [...new Set<string>(bookingsResponse.data.map((b: any) => b.client_id as string))];
          console.log('[useCarerMessageContacts] Found client IDs from bookings:', clientIds);
        }

        // If no clients from bookings, get all clients from the same branch
        if (clientIds.length === 0) {
          console.log('[useCarerMessageContacts] No bookings found, fetching branch clients');
          
          const branchClientsResponse = await (supabase as any)
            .from('clients')
            .select('id')
            .eq('branch_id', carerProfile.branchId)
            .not('auth_user_id', 'is', null);

          if (branchClientsResponse.data && branchClientsResponse.data.length > 0) {
            clientIds = branchClientsResponse.data.map((c: any) => c.id as string);
            console.log('[useCarerMessageContacts] Found client IDs from branch:', clientIds);
          }
        }

        if (clientIds.length === 0) {
          console.log('[useCarerMessageContacts] No clients found');
          return [];
        }

        // Now fetch client details with auth_user_id
        const clientsResponse = await (supabase as any)
          .from('clients')
          .select('id, first_name, last_name, auth_user_id, branch_id, organization_id')
          .in('id', clientIds)
          .not('auth_user_id', 'is', null)
          .order('first_name');

        console.log('[useCarerMessageContacts] Clients response:', clientsResponse);

        if (clientsResponse.error) {
          console.error('Error fetching clients:', clientsResponse.error);
          throw clientsResponse.error;
        }

        const contacts = (clientsResponse.data || []).map((client: any) => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`.trim(),
          auth_user_id: client.auth_user_id,
          branch_id: client.branch_id,
          organization_id: client.organization_id
        }));

        console.log('[useCarerMessageContacts] Final contacts:', contacts);
        return contacts;
      } catch (error) {
        console.error('Error in useCarerMessageContacts:', error);
        throw error;
      }
    },
    enabled: !!carerProfile?.id && !!carerProfile?.branchId,
  });
};