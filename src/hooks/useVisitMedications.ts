import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface VisitMedication {
  id: string;
  visit_record_id: string;
  medication_name: string;
  dosage: string;
  administration_time?: string;
  prescribed_time?: string;
  administration_method?: string;
  is_administered: boolean;
  administration_notes?: string;
  missed_reason?: string;
  side_effects_observed?: string;
  administered_by?: string;
  witnessed_by?: string;
  medication_id?: string;
  created_at: string;
  updated_at: string;
}

export const useVisitMedications = (visitRecordId?: string) => {
  const queryClient = useQueryClient();

  // Get all medications for a visit
  const { data: medications, isLoading } = useQuery({
    queryKey: ['visit-medications', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', visitRecordId)
        .order('prescribed_time', { ascending: true });

      if (error) throw error;
      return data as VisitMedication[];
    },
    enabled: !!visitRecordId,
  });

  // Add medication to visit
  const addMedication = useMutation({
    mutationFn: async (medicationData: Omit<VisitMedication, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('visit_medications')
        .insert(medicationData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications', visitRecordId] });
    },
    onError: (error: any) => {
      console.error('[useVisitMedications] Error adding medication:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to add medication: ${errorMessage}`, { duration: 5000 });
    },
  });

  // Administer medication
  const administerMedication = useMutation({
    mutationFn: async ({ 
      medicationId, 
      isAdministered, 
      notes, 
      missedReason,
      sideEffects,
      administeredBy,
      witnessedBy
    }: {
      medicationId: string;
      isAdministered: boolean;
      notes?: string;
      missedReason?: string;
      sideEffects?: string;
      administeredBy?: string;
      witnessedBy?: string;
    }) => {
      const updates: Partial<VisitMedication> = {
        is_administered: isAdministered,
        administration_notes: notes,
        missed_reason: missedReason,
        side_effects_observed: sideEffects,
        administered_by: administeredBy,
        witnessed_by: witnessedBy,
      };

      if (isAdministered) {
        updates.administration_time = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('visit_medications')
        .update(updates)
        .eq('id', medicationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications', visitRecordId] });
      toast.success('Medication record updated');
    },
    onError: (error: any) => {
      console.error('[useVisitMedications] Error updating medication:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to update medication: ${errorMessage}`, { duration: 5000 });
    },
  });

  // Add common medications for a visit
  const addCommonMedications = useMutation({
    mutationFn: async ({ visitRecordId, clientId }: { visitRecordId: string; clientId: string }) => {
      // Fetch active medications from client's care plan
      const { data: clientMedications, error: medicationsError } = await supabase
        .from('client_medications')
        .select(`
          id,
          name,
          dosage,
          frequency,
          care_plan_id,
          client_care_plans!inner (
            client_id,
            status
          )
        `)
        .eq('client_care_plans.client_id', clientId)
        .in('client_care_plans.status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved'])
        .eq('status', 'active');

      if (medicationsError) {
        console.error('Error fetching client medications:', medicationsError);
        throw medicationsError;
      }

      if (!clientMedications || clientMedications.length === 0) {
        console.log('No active medications found for client, skipping medication loading');
        return [];
      }

      // Convert client medications to visit medications
      const visitMedications = clientMedications.map(med => ({
        visit_record_id: visitRecordId,
        medication_id: med.id,
        medication_name: med.name,
        dosage: med.dosage,
        prescribed_time: med.frequency.includes('morning') ? '08:00' : 
                        med.frequency.includes('noon') || med.frequency.includes('lunch') ? '12:00' :
                        med.frequency.includes('evening') || med.frequency.includes('night') ? '18:00' : '08:00',
        administration_method: 'oral', // Default method since not in client_medications table
        is_administered: false,
      }));

      const { data, error } = await supabase
        .from('visit_medications')
        .insert(visitMedications)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications', visitRecordId] });
      if (data && data.length > 0) {
        toast.success(`${data.length} active medications loaded for this visit`, { id: 'medications-loaded' });
      } else {
        // Use unique ID to prevent duplicate toasts
        toast.info('No active medications found for this client', { id: 'no-medications-info' });
      }
    },
    onError: (error) => {
      console.error('Error adding medications:', error);
      toast.error('Failed to load medications');
    },
  });

  const administeredMedications = medications?.filter(med => med.is_administered) || [];
  const pendingMedications = medications?.filter(med => !med.is_administered) || [];
  const missedMedications = medications?.filter(med => !med.is_administered && med.missed_reason) || [];

  return {
    medications,
    administeredMedications,
    pendingMedications,
    missedMedications,
    isLoading,
    addMedication,
    administerMedication,
    addCommonMedications,
  };
};