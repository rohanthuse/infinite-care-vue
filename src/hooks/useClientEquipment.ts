
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientEquipment {
  id: string;
  client_id: string;
  equipment_name: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  installation_date?: string;
  maintenance_schedule?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  status: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientEquipment = async (clientId: string): Promise<ClientEquipment[]> => {
  console.log('[fetchClientEquipment] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_equipment')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchClientEquipment] Error:', error);
    throw error;
  }

  return data || [];
};

const createClientEquipment = async (equipment: Omit<ClientEquipment, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[createClientEquipment] Creating:', equipment);
  
  const { data, error } = await supabase
    .from('client_equipment')
    .insert(equipment)
    .select()
    .single();

  if (error) {
    console.error('[createClientEquipment] Error:', error);
    throw error;
  }

  return data;
};

const updateClientEquipment = async (id: string, equipment: Partial<ClientEquipment>) => {
  console.log('[updateClientEquipment] Updating:', id, equipment);
  
  const { data, error } = await supabase
    .from('client_equipment')
    .update(equipment)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientEquipment] Error:', error);
    throw error;
  }

  return data;
};

export const useClientEquipment = (clientId: string) => {
  return useQuery({
    queryKey: ['client-equipment', clientId],
    queryFn: () => fetchClientEquipment(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientEquipment,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-equipment', data.client_id] });
    },
  });
};

export const useUpdateClientEquipment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...equipment }: { id: string } & Partial<ClientEquipment>) => 
      updateClientEquipment(id, equipment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-equipment', data.client_id] });
    },
  });
};
