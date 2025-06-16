
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfile } from './useClientData';
import { useAuth } from './useAuth';

// Hook for carers to get their assigned clients
export const useCarerClients = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['carer-clients', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      // First, get the carer's staff record
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('id', user.id) // Assuming staff table uses auth user id
        .single();

      if (staffError) throw staffError;

      // Then get assigned clients
      const { data, error } = await supabase
        .from('client_carer_assignments')
        .select(`
          *,
          clients:client_id(*)
        `)
        .eq('carer_id', staffData.id);

      if (error) throw error;
      
      return data.map(assignment => assignment.clients).filter(Boolean) as ClientProfile[];
    },
    enabled: !!user?.id,
  });
};

// Hook for carers to get specific client details they're assigned to
export const useCarerClientDetail = (clientId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['carer-client-detail', clientId, user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_care_plans(*),
          client_appointments(*)
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!(clientId && user?.id),
  });
};

// Hook for carers to update assigned client data
export const useCarerUpdateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ clientId, updates }: { clientId: string; updates: Partial<ClientProfile> }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['carer-clients'] });
      queryClient.invalidateQueries({ queryKey: ['carer-client-detail', data.id] });
    },
  });
};
