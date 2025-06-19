
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UpdateClientParams {
  clientId: string;
  updates: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    address?: string;
    gender?: string;
    preferred_name?: string;
    title?: string;
    middle_name?: string;
    telephone_number?: string;
    mobile_number?: string;
    country_code?: string;
    region?: string;
    pronouns?: string;
    other_identifier?: string;
    additional_information?: string;
  };
}

const updateClient = async ({ clientId, updates }: UpdateClientParams) => {
  console.log('[updateClient] Updating client:', clientId, updates);
  
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('[updateClient] Error:', error);
    throw error;
  }

  return data;
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
      queryClient.invalidateQueries({ queryKey: ['client-profile', data.id] });
    },
  });
};
