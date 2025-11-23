import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleClientAuth = () => {
  return useQuery({
    queryKey: ['simpleClientAuth'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[useSimpleClientAuth] No authenticated user');
        throw new Error('Not authenticated');
      }

      console.log('[useSimpleClientAuth] Checking client access for user:', {
        userId: user.id,
        email: user.email
      });

      // Check if this user exists in the clients table using auth_user_id
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, branch_id, status')
        .eq('auth_user_id', user.id)
        .single();

      if (error || !clientData) {
        console.log('[useSimpleClientAuth] Client not found:', error?.message);
        throw new Error('Client not found');
      }

      console.log('[useSimpleClientAuth] Client authenticated:', {
        clientId: clientData.id,
        name: `${clientData.first_name} ${clientData.last_name}`,
        branchId: clientData.branch_id
      });

      // Allow clients to login regardless of status - status filtering removed

      return {
        user,
        client: clientData,
        isClient: true
      };
    },
    enabled: true,
    retry: 1,
  });
};