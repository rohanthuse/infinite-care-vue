
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateEquipmentData {
  client_id: string;
  equipment_name: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  status: string;
  location?: string;
  installation_date?: string;
  maintenance_schedule?: string;
  notes?: string;
}

export const useCreateClientEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEquipmentData) => {
      const { data: result, error } = await supabase
        .from('client_equipment')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-equipment', data.client_id] });
      toast.success('Equipment added successfully');
    },
    onError: (error) => {
      console.error('Error creating equipment:', error);
      toast.error('Failed to add equipment');
    },
  });
};
