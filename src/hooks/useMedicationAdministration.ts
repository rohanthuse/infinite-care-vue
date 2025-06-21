
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface MedicationAdministrationRecord {
  id: string;
  medication_id: string;
  administered_at: string;
  administered_by: string;
  status: 'given' | 'refused' | 'not_given' | 'not_applicable';
  notes?: string;
  created_at: string;
}

export interface MARFormData {
  medication_id: string;
  administered_at: string;
  administered_by: string;
  status: 'given' | 'refused' | 'not_given' | 'not_applicable';
  notes?: string;
}

// Hook to fetch MAR records for a medication
export function useMARByMedication(medicationId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['mar', medicationId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('medication_administration_records')
        .select('*')
        .eq('medication_id', medicationId)
        .order('administered_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('administered_at', dateRange.start)
          .lte('administered_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as MedicationAdministrationRecord[];
    },
    enabled: !!medicationId,
  });
}

// Hook to fetch MAR records for a client
export function useMARByClient(clientId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['mar', 'client', clientId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('medication_administration_records')
        .select(`
          *,
          client_medications!inner(
            name,
            dosage,
            client_care_plans!inner(
              client_id
            )
          )
        `)
        .eq('client_medications.client_care_plans.client_id', clientId)
        .order('administered_at', { ascending: false });

      if (dateRange) {
        query = query
          .gte('administered_at', dateRange.start)
          .lte('administered_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

// Hook to record medication administration
export function useRecordMedicationAdministration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (marData: MARFormData) => {
      const { data, error } = await supabase
        .from('medication_administration_records')
        .insert(marData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mar'] });
      toast.success('Medication administration recorded successfully');
    },
    onError: (error) => {
      console.error('Error recording medication administration:', error);
      toast.error('Failed to record medication administration');
    },
  });
}

// Hook to get pending medications (due for administration)
export function usePendingMedications(branchId?: string) {
  return useQuery({
    queryKey: ['medications', 'pending', branchId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('client_medications')
        .select(`
          *,
          client_care_plans!inner(
            client_id,
            clients!inner(
              id,
              first_name,
              last_name,
              branch_id
            )
          )
        `)
        .eq('status', 'active')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`);

      if (branchId) {
        query = query.eq('client_care_plans.clients.branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter medications that haven't been administered today
      const medicationsWithStatus = await Promise.all(
        data.map(async (medication) => {
          const { data: marData } = await supabase
            .from('medication_administration_records')
            .select('status')
            .eq('medication_id', medication.id)
            .gte('administered_at', today)
            .lt('administered_at', `${today}T23:59:59`);

          const todayRecord = marData?.[0];
          return {
            ...medication,
            administration_status: todayRecord?.status || 'pending'
          };
        })
      );

      return medicationsWithStatus.filter(med => med.administration_status === 'pending');
    },
    refetchInterval: 60000, // Refetch every minute
  });
}
