import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClientFundingInfo, ClientFundingPeriod } from '@/types/billing';

interface CreateFundingPeriodData {
  client_id: string;
  funding_type: 'private' | 'authority';
  authority_id?: string;
  start_date: string;
  end_date?: string;
}

interface UpdateFundingPeriodData extends CreateFundingPeriodData {
  id: string;
}

// Get current funding info for a client
export const useClientFundingInfo = (clientId: string, date?: string) => {
  return useQuery({
    queryKey: ['client-funding-info', clientId, date],
    queryFn: async (): Promise<ClientFundingInfo | null> => {
      const { data, error } = await supabase
        .rpc('get_client_funding_info', {
          p_client_id: clientId,
          p_date: date || new Date().toISOString().split('T')[0]
        });

      if (error) {
        console.error('Error fetching client funding info:', error);
        throw error;
      }

      const result = data?.[0];
      return result ? {
        funding_type: result.funding_type as 'private' | 'authority',
        authority_id: result.authority_id,
        authority_name: result.authority_name
      } : null;
    },
    enabled: Boolean(clientId),
  });
};

// Get funding periods for a client
export const useClientFundingPeriods = (clientId: string) => {
  return useQuery({
    queryKey: ['client-funding-periods', clientId],
    queryFn: async (): Promise<ClientFundingPeriod[]> => {
      const { data, error } = await supabase
        .from('client_funding_periods')
        .select(`
          *,
          organizations:authority_id(name)
        `)
        .eq('client_id', clientId)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching funding periods:', error);
        throw error;
      }

      return data?.map(item => ({
        ...item,
        funding_type: item.funding_type as 'private' | 'authority'
      })) || [];
    },
    enabled: Boolean(clientId),
  });
};

// Create funding period
export const useCreateFundingPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFundingPeriodData) => {
      const { data: result, error } = await supabase
        .from('client_funding_periods')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success('Funding period created successfully');
      queryClient.invalidateQueries({ queryKey: ['client-funding-periods', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-funding-info', data.client_id] });
    },
    onError: (error) => {
      console.error('Error creating funding period:', error);
      toast.error('Failed to create funding period');
    },
  });
};

// Update funding period
export const useUpdateFundingPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateFundingPeriodData) => {
      const { data: result, error } = await supabase
        .from('client_funding_periods')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      toast.success('Funding period updated successfully');
      queryClient.invalidateQueries({ queryKey: ['client-funding-periods', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['client-funding-info', data.client_id] });
    },
    onError: (error) => {
      console.error('Error updating funding period:', error);
      toast.error('Failed to update funding period');
    },
  });
};

// Delete funding period
export const useDeleteFundingPeriod = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_funding_periods')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (_, id) => {
      toast.success('Funding period deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['client-funding-periods'] });
      queryClient.invalidateQueries({ queryKey: ['client-funding-info'] });
    },
    onError: (error) => {
      console.error('Error deleting funding period:', error);
      toast.error('Failed to delete funding period');
    },
  });
};

// Update client's default funding type
export const useUpdateClientFunding = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      fundingType,
      authorityId
    }: {
      clientId: string;
      fundingType: 'private' | 'authority';
      authorityId?: string;
    }) => {
      const { data, error } = await supabase
        .from('clients')
        .update({
          funding_type: fundingType,
          authority_id: authorityId
        })
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Client funding updated successfully');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client-funding-info', data.id] });
    },
    onError: (error) => {
      console.error('Error updating client funding:', error);
      toast.error('Failed to update client funding');
    },
  });
};