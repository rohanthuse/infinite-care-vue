
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Medication {
  id: string;
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day?: string[] | null;
  start_date: string;
  end_date?: string;
  status: string;
  notes?: string;
  shape?: string | null;
  route?: string | null;
  who_administers?: string | null;
  level?: string | null;
  instruction?: string | null;
  warning?: string | null;
  side_effect?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  created_by_profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email?: string | null;
  } | null;
  created_by_role?: {
    role: string;
  } | null;
}

export interface MedicationFormData {
  care_plan_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time_of_day?: string[] | null;
  start_date: string;
  end_date?: string | null;
  status?: string;
  notes?: string;
  shape?: string | null;
  route?: string | null;
  who_administers?: string | null;
  level?: string | null;
  instruction?: string | null;
  warning?: string | null;
  side_effect?: string | null;
  created_by?: string;
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
      // First fetch medications
      const { data: medications, error } = await supabase
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
      
      // Get unique creator IDs
      const creatorIds = [...new Set(medications?.map(m => m.created_by).filter(Boolean))] as string[];
      
      // Fetch profiles and roles for creators
      let profilesMap: Record<string, { id: string; first_name: string | null; last_name: string | null; email?: string | null }> = {};
      let rolesMap: Record<string, string> = {};
      
      if (creatorIds.length > 0) {
        const [profilesResult, rolesResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', creatorIds),
          supabase
            .from('user_roles')
            .select('user_id, role')
            .in('user_id', creatorIds)
        ]);
        
        if (profilesResult.data) {
          profilesResult.data.forEach(p => {
            profilesMap[p.id] = { id: p.id, first_name: p.first_name, last_name: p.last_name, email: p.email };
          });
        }
        
        if (rolesResult.data) {
          rolesResult.data.forEach(r => {
            rolesMap[r.user_id] = r.role;
          });
        }
      }
      
      // Merge profile and role data into medications
      const enrichedMedications = medications?.map(med => ({
        ...med,
        created_by_profile: med.created_by ? profilesMap[med.created_by] || null : null,
        created_by_role: med.created_by && rolesMap[med.created_by] ? { role: rolesMap[med.created_by] } : null,
      }));
      
      return enrichedMedications as (Medication & { client_care_plans: { client_id: string; title: string } })[];
    },
    enabled: !!clientId,
  });
}

// Enhanced hook to create a new medication with better error handling
export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (medicationData: MedicationFormData) => {
      console.log('[useCreateMedication] Attempting to create medication:', medicationData);

      // Validate required fields
      if (!medicationData.care_plan_id) {
        throw new Error('Care plan ID is required');
      }
      if (!medicationData.name?.trim()) {
        throw new Error('Medication name is required');
      }
      if (!medicationData.dosage?.trim()) {
        throw new Error('Dosage is required');
      }
      if (!medicationData.frequency?.trim()) {
        throw new Error('Frequency is required');
      }

      // Verify that the care plan exists before creating medication
      console.log('[useCreateMedication] Verifying care plan exists:', medicationData.care_plan_id);
      
      const { data: carePlan, error: carePlanError } = await supabase
        .from('client_care_plans')
        .select('id, status')
        .eq('id', medicationData.care_plan_id)
        .single();

      if (carePlanError) {
        console.error('[useCreateMedication] Care plan verification failed:', carePlanError);
        throw new Error(`Care plan not found: ${carePlanError.message}`);
      }

      if (!carePlan) {
        throw new Error('Care plan does not exist');
      }

      console.log('[useCreateMedication] Care plan verified, creating medication');

      // Create the medication
      const { data, error } = await supabase
        .from('client_medications')
        .insert(medicationData)
        .select()
        .single();

      if (error) {
        console.error('[useCreateMedication] Medication creation failed:', error);
        
        // Provide more specific error messages based on the error
        if (error.code === '23503') {
          throw new Error('Care plan not found or invalid');
        } else if (error.code === '42501') {
          throw new Error('Permission denied - please check your access rights');
        } else if (error.message.includes('RLS')) {
          throw new Error('Access denied - medication could not be created for this care plan');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }

      console.log('[useCreateMedication] Medication created successfully:', data.id);
      return data;
    },
    onSuccess: (data, variables) => {
      console.log('[useCreateMedication] Success callback - invalidating queries');
      
      // Invalidate all medication-related queries
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['branch-clients-for-medication'] });
      queryClient.invalidateQueries({ queryKey: ['care-plans'] });
      
      // Note: We don't show a success toast here as it's handled in the component
      console.log('[useCreateMedication] Medication created successfully');
    },
    onError: (error) => {
      console.error('[useCreateMedication] Error in mutation:', error);
      // Note: Error toast is handled in the component for better control
    },
  });
}

// Hook to update a medication
export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: Partial<MedicationFormData> & { id: string }) => {
      console.log('[useUpdateMedication] Updating medication:', id, updateData);
      
      const { data, error } = await supabase
        .from('client_medications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[useUpdateMedication] Update failed:', error);
        throw error;
      }
      
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
      console.log('[useDeleteMedication] Deleting medication:', id);
      
      const { error } = await supabase
        .from('client_medications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[useDeleteMedication] Delete failed:', error);
        throw error;
      }
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
