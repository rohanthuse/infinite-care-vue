
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientEvent {
  id: string;
  client_id: string;
  event_type: string;
  title: string;
  description?: string;
  severity: string;
  reporter: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const fetchClientEvents = async (clientId: string): Promise<ClientEvent[]> => {
  const { data, error } = await supabase
    .from('client_events_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClientEvent = async (event: Omit<ClientEvent, 'id' | 'created_at' | 'updated_at' | 'status'>) => {
  const { data, error } = await supabase
    .from('client_events_logs')
    .insert([{ ...event, status: 'open' }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useClientEvents = (clientId: string) => {
  return useQuery({
    queryKey: ['client-events', clientId],
    queryFn: () => fetchClientEvents(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateClientEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-events', data.client_id] });
    },
  });
};
