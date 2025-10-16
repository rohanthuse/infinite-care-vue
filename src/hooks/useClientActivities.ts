
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientActivity {
  id: string;
  care_plan_id: string;
  name: string;
  description?: string;
  frequency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const fetchClientActivities = async (carePlanId: string): Promise<ClientActivity[]> => {
  const { data, error } = await supabase
    .from('client_activities')
    .select('*')
    .eq('care_plan_id', carePlanId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

const createClientActivity = async (activity: Omit<ClientActivity, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('client_activities')
    .insert([activity])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const useClientActivities = (carePlanId: string) => {
  return useQuery({
    queryKey: ['client-activities', carePlanId],
    queryFn: () => fetchClientActivities(carePlanId),
    enabled: Boolean(carePlanId),
  });
};

export const useCreateClientActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createClientActivity,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-activities', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['client-activities'] });
      toast.success('Activity created successfully');
    },
    onError: () => {
      toast.error('Failed to create activity');
    },
  });
};

export const useUpdateClientActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ClientActivity> }) => {
      const { data, error } = await supabase
        .from('client_activities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-activities', data.care_plan_id] });
      queryClient.invalidateQueries({ queryKey: ['client-activities'] });
      toast.success('Activity updated successfully');
    },
    onError: () => {
      toast.error('Failed to update activity');
    },
  });
};

export const useDeleteClientActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, carePlanId }: { id: string; carePlanId: string }) => {
      const { error } = await supabase
        .from('client_activities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, carePlanId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-activities', data.carePlanId] });
      queryClient.invalidateQueries({ queryKey: ['client-activities'] });
      toast.success('Activity deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete activity');
    },
  });
};
