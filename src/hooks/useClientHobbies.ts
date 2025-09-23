import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Hobby } from '@/data/hooks/useHobbies';

export interface ClientHobby {
  id: string;
  client_id: string;
  hobby_id: string;
  interest_level: 'low' | 'medium' | 'high';
  notes: string | null;
  created_at: string;
  hobby?: Hobby;
}

export interface StaffHobby {
  id: string;
  staff_id: string;
  hobby_id: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced';
  enjoys_teaching: boolean;
  notes: string | null;
  created_at: string;
  hobby?: Hobby;
}

async function fetchClientHobbies(clientId: string): Promise<ClientHobby[]> {
  const { data, error } = await supabase
    .from('client_hobbies')
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ClientHobby[];
}

async function fetchStaffHobbies(staffId: string): Promise<StaffHobby[]> {
  const { data, error } = await supabase
    .from('staff_hobbies')
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as StaffHobby[];
}

async function addClientHobby(clientHobby: Omit<ClientHobby, 'id' | 'created_at' | 'hobby'>): Promise<ClientHobby> {
  const { data, error } = await supabase
    .from('client_hobbies')
    .insert(clientHobby)
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .single();

  if (error) throw error;
  return data as ClientHobby;
}

async function addStaffHobby(staffHobby: Omit<StaffHobby, 'id' | 'created_at' | 'hobby'>): Promise<StaffHobby> {
  const { data, error } = await supabase
    .from('staff_hobbies')
    .insert(staffHobby)
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .single();

  if (error) throw error;
  return data as StaffHobby;
}

async function removeClientHobby(id: string): Promise<void> {
  const { error } = await supabase
    .from('client_hobbies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function removeStaffHobby(id: string): Promise<void> {
  const { error } = await supabase
    .from('staff_hobbies')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

async function updateClientHobby(id: string, updates: Partial<ClientHobby>): Promise<ClientHobby> {
  const { data, error } = await supabase
    .from('client_hobbies')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      hobby:hobbies(id, title, status)
    `)
    .single();

  if (error) throw error;
  return data as ClientHobby;
}

export function useClientHobbies(clientId: string) {
  return useQuery({
    queryKey: ['client-hobbies', clientId],
    queryFn: () => fetchClientHobbies(clientId),
    enabled: !!clientId,
  });
}

export function useStaffHobbies(staffId: string) {
  return useQuery({
    queryKey: ['staff-hobbies', staffId],
    queryFn: () => fetchStaffHobbies(staffId),
    enabled: !!staffId,
  });
}

export function useAddClientHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addClientHobby,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-hobbies', data.client_id] });
    },
  });
}

export function useAddStaffHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addStaffHobby,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-hobbies', data.staff_id] });
    },
  });
}

export function useRemoveClientHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeClientHobby,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-hobbies'] });
    },
  });
}

export function useRemoveStaffHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStaffHobby,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-hobbies'] });
    },
  });
}

export function useUpdateClientHobby() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClientHobby> }) =>
      updateClientHobby(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-hobbies', data.client_id] });
    },
  });
}