import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientBehaviorSupport {
  id: string;
  client_id: string;
  challenging_behaviors: string | null;
  behavior_triggers: string | null;
  early_warning_signs: string | null;
  preventative_strategies: string | null;
  crisis_management_plan: string | null;
  post_incident_protocol: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

async function fetchClientBehaviorSupport(clientId: string): Promise<ClientBehaviorSupport[]> {
  const { data, error } = await supabase
    .from('client_behavior_support')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ClientBehaviorSupport[];
}

async function createClientBehaviorSupport(behaviorSupport: Omit<ClientBehaviorSupport, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>): Promise<ClientBehaviorSupport> {
  const { data, error } = await supabase
    .from('client_behavior_support')
    .insert({
      ...behaviorSupport,
      created_by: (await supabase.auth.getUser()).data.user?.id || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .select()
    .single();

  if (error) throw error;
  return data as ClientBehaviorSupport;
}

async function updateClientBehaviorSupport(id: string, updates: Partial<ClientBehaviorSupport>): Promise<ClientBehaviorSupport> {
  const { data, error } = await supabase
    .from('client_behavior_support')
    .update({
      ...updates,
      updated_by: (await supabase.auth.getUser()).data.user?.id || null
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ClientBehaviorSupport;
}

async function deleteClientBehaviorSupport(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_behavior_support')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function useClientBehaviorSupport(clientId: string) {
  return useQuery({
    queryKey: ['client-behavior-support', clientId],
    queryFn: () => fetchClientBehaviorSupport(clientId),
    enabled: !!clientId,
  });
}

export function useCreateClientBehaviorSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientBehaviorSupport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-behavior-support', data.client_id] });
    },
  });
}

export function useUpdateClientBehaviorSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClientBehaviorSupport> }) =>
      updateClientBehaviorSupport(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-behavior-support', data.client_id] });
    },
  });
}

export function useDeleteClientBehaviorSupport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientBehaviorSupport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-behavior-support'] });
    },
  });
}