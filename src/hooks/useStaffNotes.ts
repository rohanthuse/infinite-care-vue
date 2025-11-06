import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface StaffNote {
  id: string;
  staff_id: string;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
}

const fetchStaffNotes = async (staffId: string): Promise<StaffNote[]> => {
  console.log('[useStaffNotes] Fetching notes for staff:', staffId);
  
  if (!staffId) {
    console.log('[useStaffNotes] No staff ID provided');
    return [];
  }

  const { data, error } = await supabase
    .from('staff_notes')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[useStaffNotes] Error fetching staff notes:', error);
    throw error;
  }

  console.log('[useStaffNotes] Successfully fetched notes:', data?.length || 0, 'notes');
  return data || [];
};

const createStaffNote = async (note: Omit<StaffNote, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[useStaffNotes] Creating note for staff:', note.staff_id);
  
  const { data, error } = await supabase
    .from('staff_notes')
    .insert([note])
    .select()
    .single();

  if (error) {
    console.error('[useStaffNotes] Error creating note:', error);
    throw error;
  }

  console.log('[useStaffNotes] Successfully created note:', data.id);
  return data;
};

const updateStaffNote = async ({ id, ...updates }: { id: string; title?: string; content?: string }) => {
  console.log('[useStaffNotes] Updating note:', id);
  
  const { data, error } = await supabase
    .from('staff_notes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[useStaffNotes] Error updating note:', error);
    throw error;
  }

  console.log('[useStaffNotes] Successfully updated note:', id);
  return data;
};

const deleteStaffNote = async (noteId: string) => {
  console.log('[useStaffNotes] Deleting note:', noteId);
  
  const { error } = await supabase
    .from('staff_notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    console.error('[useStaffNotes] Error deleting note:', error);
    throw error;
  }

  console.log('[useStaffNotes] Successfully deleted note:', noteId);
};

export const useStaffNotes = (staffId: string, options?: { enabled?: boolean; staleTime?: number; retry?: number }) => {
  return useQuery({
    queryKey: ['staff-notes', staffId],
    queryFn: () => fetchStaffNotes(staffId),
    enabled: Boolean(staffId) && (options?.enabled !== false),
    staleTime: options?.staleTime || 5 * 60 * 1000,
    retry: options?.retry || 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useCreateStaffNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-notes', data.staff_id] });
      toast.success('Note created successfully');
    },
    onError: (error) => {
      console.error('[useCreateStaffNote] Error:', error);
      toast.error('Failed to create note');
    },
  });
};

export const useUpdateStaffNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStaffNote,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-notes', data.staff_id] });
      toast.success('Note updated successfully');
    },
    onError: (error) => {
      console.error('[useUpdateStaffNote] Error:', error);
      toast.error('Failed to update note');
    },
  });
};

export const useDeleteStaffNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStaffNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-notes'] });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      console.error('[useDeleteStaffNote] Error:', error);
      toast.error('Failed to delete note');
    },
  });
};
