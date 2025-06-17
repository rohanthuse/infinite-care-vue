
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientBilling {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientBilling = async (clientId: string): Promise<ClientBilling[]> => {
  const { data, error } = await supabase
    .from('client_billing')
    .select('*')
    .eq('client_id', clientId)
    .order('invoice_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClientBilling = async (billing: Omit<ClientBilling, 'id' | 'created_at' | 'updated_at' | 'status' | 'paid_date'>) => {
  const { data, error } = await supabase
    .from('client_billing')
    .insert([{ ...billing, status: 'pending' }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useClientBilling = (clientId: string) => {
  return useQuery({
    queryKey: ['client-billing', clientId],
    queryFn: () => fetchClientBilling(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateClientBilling = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientBilling,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-billing', data.client_id] });
    },
  });
};
