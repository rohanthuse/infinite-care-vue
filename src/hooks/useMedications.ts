
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Medication {
  id: string;
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MedicationFormData {
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status?: string;
}

// Hook to fetch medications by care plan
export function useMedicationsByCarePlan(carePlanId: string) {
  return useQuery({
    queryKey: ['medications', 'care-plan', carePlanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_medications')
        .select('*')
        .eq('care_plan_id', carePlanId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Medication[];
    },
    enabled: !!carePlanId,
  });
}

// Hook to fetch all medications for a client
export function useMedicationsByClient(clientId: string) {
  return useQuery({
    queryKey: ['medications', 'client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_medications')
        .select(`
          *,
          client_care_plans!inner(
            client_id,
            title
          )
        `)
        .eq('client_care_plans.client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as (Medication & { client_care_plans: { client_id: string; title: string } })[];
    },
    enabled: !!clientId,
  });
}

// Hook to create a new medication
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicationData: MedicationFormData) => {
      const { data, error } = await supabase
        .from('client_medications')
        .insert(medicationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication added successfully');
    },
    onError: (error) => {
      console.error('Error creating medication:', error);
      toast.error('Failed to add medication');
    },
  });
}

// Hook to update a medication
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<MedicationFormData> & { id: string }) => {
      const { data, error } = await supabase
        .from('client_medications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication updated successfully');
    },
    onError: (error) => {
      console.error('Error updating medication:', error);
      toast.error('Failed to update medication');
    },
  });
}

// Hook to delete a medication
export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_medications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      toast.success('Medication deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting medication:', error);
      toast.error('Failed to delete medication');
    },
  });
}

// Hook to get medications by branch (for overview)
export function useMedicationsByBranch(branchId: string) {
  return useQuery({
    queryKey: ['medications', 'branch', branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_medications')
        .select(`
          *,
          client_care_plans!inner(
            client_id,
            title,
            clients!inner(
              id,
              first_name,
              last_name,
              branch_id
            )
          )
        `)
        .eq('client_care_plans.clients.branch_id', branchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!branchId,
  });
}
