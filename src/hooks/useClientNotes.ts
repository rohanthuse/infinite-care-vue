
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
  console.log('[useClientNotes] Fetching notes for client:', clientId);
  
  if (!clientId) {
    console.log('[useClientNotes] No client ID provided');
    return [];
  }

  const { data, error } = await supabase
    .from('client_notes')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useClientNotes] Error fetching client notes:', error);
    throw error;
  }

  console.log('[useClientNotes] Successfully fetched notes:', data?.length || 0, 'notes');
  return data || [];
};

const createClientNote = async (note: Omit<ClientNote, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[useClientNotes] Creating note for client:', note.client_id);
  
  const { data, error } = await supabase
    .from('client_notes')
    .insert([note])
    .select()
    .single();

  if (error) {
    console.error('[useClientNotes] Error creating note:', error);
    throw error;
  }

  console.log('[useClientNotes] Successfully created note:', data.id);
  return data;
};

const updateClientNote = async ({ id, ...updates }: { id: string; title?: string; content?: string }) => {
  console.log('[useClientNotes] Updating note:', id);
  
  const { data, error } = await supabase
    .from('client_notes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[useClientNotes] Error updating note:', error);
    throw error;
  }

  console.log('[useClientNotes] Successfully updated note:', id);
  return data;
};

const deleteClientNote = async (noteId: string) => {
  console.log('[useClientNotes] Deleting note:', noteId);
  
  const { error } = await supabase
    .from('client_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('[useClientNotes] Error deleting note:', error);
    throw error;
  }

  console.log('[useClientNotes] Successfully deleted note:', noteId);
};

export const useClientNotes = (clientId: string, options?: { enabled?: boolean; staleTime?: number; retry?: number }) => {
  return useQuery({
    queryKey: ['client-notes', clientId],
    queryFn: () => fetchClientNotes(clientId),
    enabled: Boolean(clientId) && (options?.enabled !== false),
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes default
    retry: options?.retry || 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
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
    onError: (error) => {
      console.error('[useCreateClientNote] Error:', error);
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
    onError: (error) => {
      console.error('[useUpdateClientNote] Error:', error);
      toast.error('Failed to update note');
    },
  });
};

export const useDeleteClientNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteClientNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-notes'] });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      console.error('[useDeleteClientNote] Error:', error);
      toast.error('Failed to delete note');
    },
  });
};
