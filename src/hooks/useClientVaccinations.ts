import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientVaccination {
  id: string;
  client_id: string;
  vaccination_name: string;
  vaccination_date: string;
  next_due_date?: string;
  interval_months?: number;
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  branch_id?: string;
  organization_id?: string;
}

const fetchClientVaccinations = async (clientId: string): Promise<ClientVaccination[]> => {
  try {
    const { data, error } = await supabase
      .from('client_vaccinations')
      .select('*')
      .eq('client_id', clientId)
      .order('vaccination_date', { ascending: false });

    if (error) {
      console.error('[fetchClientVaccinations] Error:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[fetchClientVaccinations] Catch error:', error);
    toast.error('Failed to load vaccination records');
    return [];
  }
};

const createClientVaccination = async (
  vaccination: Omit<ClientVaccination, 'id' | 'created_at' | 'updated_at' | 'branch_id' | 'organization_id'>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('client_vaccinations')
    .insert({
      ...vaccination,
      created_by: user?.id
    })
    .select()
    .single();

  if (error) {
    console.error('[createClientVaccination] Error:', error);
    throw error;
  }

  return data;
};

const updateClientVaccination = async ({
  id,
  updates
}: {
  id: string;
  updates: Partial<ClientVaccination>;
}) => {
  const { data, error } = await supabase
    .from('client_vaccinations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientVaccination] Error:', error);
    throw error;
  }

  return data;
};

const deleteClientVaccination = async (id: string) => {
  const { error } = await supabase
    .from('client_vaccinations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteClientVaccination] Error:', error);
    throw error;
  }
};

export const useClientVaccinations = (clientId: string) => {
  return useQuery({
    queryKey: ['client-vaccinations', clientId],
    queryFn: () => fetchClientVaccinations(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientVaccination = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vaccinations'] });
      toast.success('Vaccination record created successfully');
    },
    onError: (error: any) => {
      console.error('[useCreateClientVaccination] Error:', error);
      toast.error('Failed to create vaccination record');
    }
  });
};

export const useUpdateClientVaccination = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateClientVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vaccinations'] });
      toast.success('Vaccination record updated successfully');
    },
    onError: (error: any) => {
      console.error('[useUpdateClientVaccination] Error:', error);
      toast.error('Failed to update vaccination record');
    }
  });
};

export const useDeleteClientVaccination = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteClientVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-vaccinations'] });
      toast.success('Vaccination record deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteClientVaccination] Error:', error);
      toast.error('Failed to delete vaccination record');
    }
  });
};
