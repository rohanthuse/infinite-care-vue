
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
    pin_code?: string;
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
    avatar_initials?: string;
    registered_on?: string;
    referral_route?: string;
    status?: string;
  };
}

const updateClient = async ({ clientId, updates }: UpdateClientParams) => {
  console.log('[updateClient] Updating client:', clientId, updates);
  
  // Sanitize updates object
  const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      acc[key] = trimmedValue === '' ? null : trimmedValue;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  console.log('[updateClient] Sanitized updates:', sanitizedUpdates);
  
  const { data, error } = await supabase
    .from('clients')
    .update(sanitizedUpdates)
    .eq('id', clientId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[updateClient] Error:', error);
    throw error;
  }

  console.log('[updateClient] Success:', data);
  return data;
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClient,
    onSuccess: (data, variables) => {
      // Use clientId from variables as fallback if data is null
      const clientId = data?.id || variables.clientId;
      
      console.log('[useUpdateClient] Success - invalidating queries for client:', clientId);
      
      // Invalidate all relevant queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
      queryClient.invalidateQueries({ queryKey: ['client-profile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['branch-statistics'] });
    },
    onError: (error, variables) => {
      console.error('[useUpdateClient] Error updating client:', variables.clientId, error);
    },
  });
};
