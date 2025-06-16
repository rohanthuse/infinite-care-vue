
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientProfile, ClientCarePlan, ClientAppointment } from './useClientData';

// Hook for admins to get all clients in their branch
export const useAdminClients = (branchId: string) => {
  return useQuery({
    queryKey: ['admin-clients', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ClientProfile[];
    },
    enabled: !!branchId,
  });
};

// Hook for admins to get specific client details
export const useAdminClientDetail = (clientId: string) => {
  return useQuery({
    queryKey: ['admin-client-detail', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          client_care_plans(*),
          client_appointments(*),
          client_billing(*)
        `)
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

// Hook for admins to update client data
export const useAdminUpdateClient = () => {
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
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin-client-detail', data.id] });
    },
  });
};

// Hook to create new client (admin only)
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientData: Omit<ClientProfile, 'id'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(clientData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
    },
  });
};
