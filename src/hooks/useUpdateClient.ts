
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
    core_lead_id?: string | null;
    agreement_id?: string | null;
    expiry_date?: string | null;
    show_in_task_matrix?: boolean;
    show_in_form_matrix?: boolean;
    enable_geo_fencing?: boolean;
    active_from?: string | null;
    active_until?: string | null;
  };
}

const updateClient = async ({ clientId, updates }: UpdateClientParams) => {
  console.log('[updateClient] Updating client:', clientId, updates);
  
  // Validate inputs
  if (!clientId) {
    throw new Error('Client ID is required');
  }
  
  // Sanitize updates object
  const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    // Boolean fields should not be trimmed
    if (typeof value === 'boolean') {
      acc[key] = value;
    } else if (typeof value === 'string') {
      const trimmedValue = value.trim();
      acc[key] = trimmedValue === '' ? null : trimmedValue;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);
  
  // Validate that we have at least one field to update
  if (Object.keys(sanitizedUpdates).length === 0) {
    throw new Error('No fields to update');
  }
  
  console.log('[updateClient] Sanitized updates:', sanitizedUpdates);
  
  // Perform update without trying to return data (prevents 406 error)
  const { error } = await supabase
    .from('clients')
    .update(sanitizedUpdates)
    .eq('id', clientId);

  if (error) {
    console.error('[updateClient] Error:', error);
    throw error;
  }

  console.log('[updateClient] Success - updated client:', clientId);
  return { id: clientId };
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClient,
    onMutate: async (variables) => {
      const { clientId, updates } = variables;
      
      // Cancel outgoing refetches for the client detail
      await queryClient.cancelQueries({ queryKey: ['admin-client-detail', clientId] });
      
      // Snapshot the previous value
      const previousClient = queryClient.getQueryData(['admin-client-detail', clientId]);
      
      // Optimistically update the cache with new data
      queryClient.setQueryData(['admin-client-detail', clientId], (old: any) => {
        // Always apply updates, even if old data is null/undefined
        const baseData = old || { id: clientId };
        return { ...baseData, ...updates };
      });
      
      // Also update the clients list cache if it exists
      queryClient.setQueryData(['admin-clients'], (old: any) => {
        if (!old || !Array.isArray(old)) return old;
        return old.map((client: any) => 
          client.id === clientId ? { ...client, ...updates } : client
        );
      });
      
      console.log('[useUpdateClient] Optimistic update applied for client:', clientId, updates);
      
      // Return context with previous data for potential rollback
      return { previousClient, clientId };
    },
    onSuccess: (data, variables) => {
      // Use clientId from returned data or variables
      const clientId = data?.id || variables.clientId;
      
      console.log('[useUpdateClient] Success - invalidating queries for client:', clientId);
      
      // Invalidate all relevant queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
      queryClient.invalidateQueries({ queryKey: ['client-profile', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client-general-settings', clientId] });
      queryClient.invalidateQueries({ queryKey: ['admin-client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['branch-clients'] });
      queryClient.invalidateQueries({ queryKey: ['branch-dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['branch-statistics'] });
    },
    onError: (error, variables, context) => {
      console.error('[useUpdateClient] Error updating client:', variables.clientId, error);
      
      // Rollback optimistic update on error
      if (context?.previousClient && context?.clientId) {
        queryClient.setQueryData(['admin-client-detail', context.clientId], context.previousClient);
      }
    },
  });
};
