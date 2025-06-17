
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientNote {
  id: string;
  client_id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const fetchClientNotes = async (clientId: string): Promise<ClientNote[]> => {
  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClientNote = async (note: Omit<ClientNote, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('client_notes')
    .insert([note])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useClientNotes = (clientId: string) => {
  return useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => fetchClientNotes(clientId),
    enabled: Boolean(clientId),
  });
};

export const useCreateClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', data.client_id] });
    },
  });
};
