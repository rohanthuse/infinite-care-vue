
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

const fetchClientServiceActions = async (clientId: string): Promise<ClientServiceAction[]> => {
  console.log('[fetchClientServiceActions] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_service_actions')
    .select('*')
    .eq('client_id', clientId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('[fetchClientServiceActions] Error:', error);
    throw error;
  }

  return data || [];
};

const createClientServiceAction = async (serviceAction: Omit<ClientServiceAction, 'id' | 'created_at' | 'updated_at'>) => {
  console.log('[createClientServiceAction] Creating:', serviceAction);
  
  const { data, error } = await supabase
    .from('client_service_actions')
    .insert(serviceAction)
    .select()
    .single();

  if (error) {
    console.error('[createClientServiceAction] Error:', error);
    throw error;
  }

  return data;
};

const updateClientServiceAction = async (id: string, serviceAction: Partial<ClientServiceAction>) => {
  console.log('[updateClientServiceAction] Updating:', id, serviceAction);
  
  const { data, error } = await supabase
    .from('client_service_actions')
    .update(serviceAction)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[updateClientServiceAction] Error:', error);
    throw error;
  }

  return data;
};

export const useClientServiceActions = (clientId: string) => {
  return useQuery({
    queryKey: ['client-service-actions', clientId],
    queryFn: () => fetchClientServiceActions(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientServiceAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientServiceAction,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-service-actions', data.client_id] });
    },
  });
};

export const useUpdateClientServiceAction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...serviceAction }: { id: string } & Partial<ClientServiceAction>) => 
      updateClientServiceAction(id, serviceAction),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-service-actions', data.client_id] });
    },
  });
};
