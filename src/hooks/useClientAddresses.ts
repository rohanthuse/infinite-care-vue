import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientAddress {
  id: string;
  client_id: string;
  address_label: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state_county?: string;
  postcode: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type ClientAddressInput = Omit<ClientAddress, 'id' | 'created_at' | 'updated_at'>;

const fetchClientAddresses = async (clientId: string): Promise<ClientAddress[]> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .select('*')
    .eq('client_id', clientId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[fetchClientAddresses] Error:', error);
    throw error;
  }

  return (data || []) as ClientAddress[];
};

const createClientAddress = async (address: ClientAddressInput): Promise<ClientAddress> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .insert(address)
    .select()
    .single();

  if (error) {
    console.error('[createClientAddress] Error:', error);
    throw new Error(`Failed to create address: ${error.message}`);
  }

  return data as ClientAddress;
};

const updateClientAddress = async ({ id, ...updates }: Partial<ClientAddress> & { id: string }): Promise<ClientAddress> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientAddress] Error:', error);
    throw new Error(`Failed to update address: ${error.message}`);
  }

  return data as ClientAddress;
};

const deleteClientAddress = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('client_addresses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteClientAddress] Error:', error);
    throw new Error(`Failed to delete address: ${error.message}`);
  }
};

const setDefaultAddress = async ({ id, clientId }: { id: string; clientId: string }): Promise<ClientAddress> => {
  const { data, error } = await supabase
    .from('client_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[setDefaultAddress] Error:', error);
    throw new Error(`Failed to set default address: ${error.message}`);
  }

  return data as ClientAddress;
};

export const useClientAddresses = (clientId: string) => {
  return useQuery({
    queryKey: ['client-addresses', clientId],
    queryFn: () => fetchClientAddresses(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientAddress,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', data.client_id] });
    },
  });
};

export const useUpdateClientAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientAddress,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', data.client_id] });
    },
  });
};

export const useDeleteClientAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      await deleteClientAddress(id);
      return clientId;
    },
    onSuccess: (clientId) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', clientId] });
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-addresses', data.client_id] });
    },
  });
};
