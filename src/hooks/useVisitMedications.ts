import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getTimeOfDayFromTimestamp, doesMedicationMatchTimeOfDay } from "@/utils/timeOfDayUtils";

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

  // Get all medications for a visit - session-stable for long visits
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
    // Session-stable: prevent unnecessary refetches during long visits
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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

  // Administer medication with automatic MAR sync
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
      // Use server timestamp for consistency
      const serverTimestamp = new Date().toISOString();
      
      const updates: Partial<VisitMedication> = {
        is_administered: isAdministered,
        administration_notes: notes,
        missed_reason: missedReason,
        side_effects_observed: sideEffects,
        administered_by: administeredBy,
        witnessed_by: witnessedBy,
      };

      if (isAdministered) {
        updates.administration_time = serverTimestamp;
      }

      // First update visit_medications
      const { data, error } = await supabase
        .from('visit_medications')
        .update(updates)
        .eq('id', medicationId)
        .select('*, visit_record_id')
        .single();

      if (error) throw error;

      // Sync to medication_administration_records (MAR) for admin charts
      if (isAdministered && data.medication_id) {
        // Check for existing MAR entry to prevent duplicates
        const { data: existingMar } = await supabase
          .from('medication_administration_records')
          .select('id')
          .eq('medication_id', data.medication_id)
          .eq('administered_at', serverTimestamp)
          .maybeSingle();

        if (!existingMar) {
          // Map status for MAR table
          const marStatus = missedReason ? 'not_given' : 'given';
          
          const { error: marError } = await supabase
            .from('medication_administration_records')
            .insert({
              medication_id: data.medication_id,
              administered_at: serverTimestamp,
              administered_by: administeredBy || 'Unknown',
              status: marStatus,
              notes: notes || undefined,
            });

          if (marError) {
            console.error('[useVisitMedications] MAR sync error (non-blocking):', marError);
            // Don't throw - MAR sync failure shouldn't block the main operation
          } else {
            console.log('[useVisitMedications] Successfully synced to MAR table');
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visit-medications', visitRecordId] });
      queryClient.invalidateQueries({ queryKey: ['medication-trend-data'] });
      toast.success('Medication record updated');
    },
    onError: (error: any) => {
      console.error('[useVisitMedications] Error updating medication:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast.error(`Failed to update medication: ${errorMessage}`, { duration: 5000 });
    },
  });

  // Add common medications for a visit (idempotent - checks for existing before inserting)
  const addCommonMedications = useMutation({
    mutationFn: async ({ visitRecordId, clientId, visitStartTime }: { visitRecordId: string; clientId: string; visitStartTime?: string }) => {
      // IDEMPOTENT CHECK: First check if medications already exist for this visit
      const { data: existingMeds, error: existingError } = await supabase
        .from('visit_medications')
        .select('id, medication_id, medication_name')
        .eq('visit_record_id', visitRecordId);

      if (existingError) {
        console.error('[useVisitMedications] Error checking existing medications:', existingError);
        throw existingError;
      }

      // If medications already exist, skip insertion and return existing ones
      if (existingMeds && existingMeds.length > 0) {
        console.log('[useVisitMedications] Medications already loaded for visit, skipping initialization. Count:', existingMeds.length);
        return existingMeds;
      }

      // Determine time of day from visit start time
      const visitTimeOfDay = visitStartTime 
        ? getTimeOfDayFromTimestamp(visitStartTime) 
        : getTimeOfDayFromTimestamp(new Date());
      
      console.log('[useVisitMedications] Visit time of day:', visitTimeOfDay, 'from:', visitStartTime || 'current time');

      // Step 1: Get the client's care plan ID first (two-step approach for reliability)
      const { data: carePlan, error: carePlanError } = await supabase
        .from('client_care_plans')
        .select('id')
        .eq('client_id', clientId)
        .in('status', ['draft', 'pending_approval', 'pending_client_approval', 'active', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (carePlanError) {
        console.error('[useVisitMedications] Error fetching care plan:', carePlanError);
        throw carePlanError;
      }

      if (!carePlan) {
        console.log('[useVisitMedications] No care plan found for client:', clientId);
        return [];
      }

      console.log('[useVisitMedications] Found care plan:', carePlan.id, 'for client:', clientId);

      // Step 2: Fetch medications for this care plan
      const { data: clientMedications, error: medicationsError } = await supabase
        .from('client_medications')
        .select('id, name, dosage, frequency, time_of_day, care_plan_id')
        .eq('care_plan_id', carePlan.id)
        .eq('status', 'active');

      if (medicationsError) {
        console.error('[useVisitMedications] Error fetching client medications:', medicationsError);
        throw medicationsError;
      }

      console.log('[useVisitMedications] Found', clientMedications?.length || 0, 'active medications for care plan:', carePlan.id);

      if (!clientMedications || clientMedications.length === 0) {
        console.log('[useVisitMedications] No active medications found for client, skipping medication loading');
        return [];
      }

      // Filter medications by time of day with fallback
      let filteredMedications = clientMedications.filter(med => 
        doesMedicationMatchTimeOfDay(med.time_of_day as string[] | null, visitTimeOfDay)
      );

      console.log(`[useVisitMedications] Filtered ${clientMedications.length} medications to ${filteredMedications.length} for ${visitTimeOfDay}`);
      
      // FALLBACK: If no medications match time_of_day, show ALL active medications
      // This prevents missing medications due to incomplete time_of_day data
      if (filteredMedications.length === 0 && clientMedications.length > 0) {
        console.log('[useVisitMedications] No medications matched time_of_day filter, showing all active medications');
        console.log('[useVisitMedications] All medications had time_of_day:', 
          clientMedications.map(m => ({ name: m.name, time_of_day: m.time_of_day }))
        );
        filteredMedications = clientMedications;
      }

      // Convert filtered client medications to visit medications
      const visitMedications = filteredMedications.map(med => ({
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