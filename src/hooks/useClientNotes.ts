
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

const updateClientNote = async ({ id, ...updates }: Partial<ClientNote> & { id: string }) => {
  const { data, error } = await supabase
    .from('client_notes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

const deleteClientNote = async (id: string) => {
  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return id;
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
      toast.success('Note created successfully');
    },
    onError: () => {
      toast.error('Failed to create note');
    },
  });
};

export const useUpdateClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateClientNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-notes', data.client_id] });
      toast.success('Note updated successfully');
    },
    onError: () => {
      toast.error('Failed to update note');
    },
  });
};

export const useDeleteClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientNote,
    onSuccess: (_, noteId) => {
      // Invalidate all client-notes queries since we don't have the client_id in the response
      queryClient.invalidateQueries({ queryKey: ['client-notes'] });
      toast.success('Note deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete note');
    },
  });
};
