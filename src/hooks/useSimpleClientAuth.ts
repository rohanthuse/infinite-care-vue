import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSimpleClientAuth = () => {
  return useQuery({
    queryKey: ['simpleClientAuth'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if this user email exists in the clients table
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, branch_id, status')
        .eq('email', user.email)
        .single();

      if (error || !clientData) {
        throw new Error('Client not found');
      }

      if (clientData.status?.toLowerCase() !== 'active') {
        throw new Error('Client account is not active');
      }

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