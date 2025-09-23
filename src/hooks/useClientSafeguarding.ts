import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientSafeguarding {
  id: string;
  client_id: string;
  absconding_risk: 'low' | 'medium' | 'high';
  absconding_plan: string | null;
  self_harm_risk: 'low' | 'medium' | 'high';
  self_harm_plan: string | null;
  violence_aggression_risk: 'low' | 'medium' | 'high';
  violence_plan: string | null;
  environmental_risks: string | null;
  safeguarding_notes: string | null;
  safeguarding_restrictions: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

async function fetchClientSafeguarding(clientId: string): Promise<ClientSafeguarding[]> {
  const { data, error } = await supabase
    .from('client_safeguarding')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ClientSafeguarding[];
}

async function createClientSafeguarding(safeguarding: Omit<ClientSafeguarding, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ClientSafeguarding> {
  const { data, error } = await supabase
    .from('client_safeguarding')
    .insert({
      ...safeguarding,
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClientSafeguarding;
}

async function updateClientSafeguarding(id: string, updates: Partial<ClientSafeguarding>): Promise<ClientSafeguarding> {
  const { data, error } = await supabase
    .from('client_safeguarding')
    .update({
      ...updates,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ClientSafeguarding;
}

async function deleteClientSafeguarding(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_safeguarding')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useClientSafeguarding(clientId: string) {
  return useQuery({
    queryKey: ['client-safeguarding', clientId],
    queryFn: () => fetchClientSafeguarding(clientId),
    enabled: !!clientId,
  });
}

export function useCreateClientSafeguarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientSafeguarding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-safeguarding', data.client_id] });
    },
  });
}

export function useUpdateClientSafeguarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClientSafeguarding> }) =>
      updateClientSafeguarding(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-safeguarding', data.client_id] });
    },
  });
}

export function useDeleteClientSafeguarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientSafeguarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-safeguarding'] });
    },
  });
}