
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CreateServiceActionData {
  client_id: string;
  care_plan_id?: string;
  service_name: string;
  service_category: string;
  provider_name: string;
  frequency: string;
  duration: string;
  schedule_details?: string;
  goals?: string[];
  progress_status: string;
  start_date: string;
  end_date?: string;
  next_scheduled_date?: string;
  notes?: string;
}

export const useCreateClientServiceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateServiceActionData) => {
      const { data: result, error } = await supabase
        .from('client_service_actions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-service-actions', data.client_id] });
      toast.success('Service action added successfully');
    },
    onError: (error) => {
      console.error('Error creating service action:', error);
      toast.error('Failed to add service action');
    },
  });
};
