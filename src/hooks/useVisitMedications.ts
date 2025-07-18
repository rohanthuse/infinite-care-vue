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
    onError: (error) => {
      console.error('Error adding medication:', error);
      toast.error('Failed to add medication');
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
    onError: (error) => {
      console.error('Error updating medication:', error);
      toast.error('Failed to update medication record');
    },
  });

  // Add common medications for a visit
  const addCommonMedications = useMutation({
    mutationFn: async ({ visitRecordId, clientId }: { visitRecordId: string; clientId: string }) => {
      // In a real app, you'd fetch from care plans or medication schedules
      const commonMedications = [
        {
          visit_record_id: visitRecordId,
          medication_name: 'Morning vitamins',
          dosage: '1 tablet',
          prescribed_time: '08:00',
          administration_method: 'oral',
          is_administered: false,
        },
        {
          visit_record_id: visitRecordId,
          medication_name: 'Blood pressure medication',
          dosage: '5mg',
          prescribed_time: '12:00',
          administration_method: 'oral',
          is_administered: false,
        },
      ];

      const { data, error } = await supabase
        .from('visit_medications')
        .insert(commonMedications)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications', visitRecordId] });
      toast.success('Medications schedule loaded');
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