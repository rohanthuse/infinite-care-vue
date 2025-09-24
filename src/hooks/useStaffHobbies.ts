import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffHobbyWithDetails {
  id: string;
  staff_id: string;
  hobby_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  enjoys_teaching: boolean;
  notes: string | null;
  created_at: string;
  hobby?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface NewStaffHobby {
  staff_id: string;
  hobby_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  enjoys_teaching: boolean;
  notes?: string;
}

const fetchStaffHobbies = async (staffId: string): Promise<StaffHobbyWithDetails[]> => {
  const { data, error } = await supabase
    .from('staff_hobbies')
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StaffHobbyWithDetails[];
};

const addStaffHobby = async (hobby: NewStaffHobby): Promise<StaffHobbyWithDetails> => {
  const { data, error } = await supabase
    .from('staff_hobbies')
    .insert(hobby)
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .single();

  if (error) throw error;
  return data as StaffHobbyWithDetails;
};

const updateStaffHobby = async (id: string, updates: Partial<StaffHobbyWithDetails>): Promise<StaffHobbyWithDetails> => {
  const { data, error } = await supabase
    .from('staff_hobbies')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .single();

  if (error) throw error;
  return data as StaffHobbyWithDetails;
};

const removeStaffHobby = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('staff_hobbies')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const useStaffHobbies = (staffId: string) => {
  return useQuery({
    queryKey: ['staff-hobbies', staffId],
    queryFn: () => fetchStaffHobbies(staffId),
    enabled: !!staffId,
  });
};

export const useAddStaffHobby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStaffHobby,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-hobbies', data.staff_id] });
    },
  });
};

export const useUpdateStaffHobby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<StaffHobbyWithDetails> }) =>
      updateStaffHobby(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-hobbies', data.staff_id] });
    },
  });
};

export const useRemoveStaffHobby = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStaffHobby,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hobbies'] });
    },
  });
};