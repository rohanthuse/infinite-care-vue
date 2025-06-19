
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientServiceAction {
  id: string;
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
  last_completed_date?: string;
  next_scheduled_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useCreateClientServiceAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ClientServiceAction, 'id' | 'created_at' | 'updated_at'>) => {
      console.log('[useCreateClientServiceAction] Creating service action:', data);
      
      const response = await supabase
        .from('client_service_actions')
        .insert(data)
        .select()
        .single();

      if (response.error) {
        console.error('[useCreateClientServiceAction] Error:', response.error);
        throw response.error;
      }

      console.log('[useCreateClientServiceAction] Success:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('[useCreateClientServiceAction] Mutation successful, invalidating queries for client:', data.client_id);
      queryClient.invalidateQueries({ queryKey: ['client-service-actions', data.client_id] });
      toast.success("Service action created successfully");
    },
    onError: (error) => {
      console.error('[useCreateClientServiceAction] Mutation error:', error);
      toast.error("Failed to create service action");
    }
  });
};
