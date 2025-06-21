
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface MedicationAdministrationRecord {
  id: string;
  medication_id: string;
  administered_at: string;
  administered_by: string;
  status: 'given' | 'refused' | 'not_given' | 'not_applicable';
  notes?: string;
  created_at: string;
  updated_at: string;
  client_medications?: {
    name: string;
    dosage: string;
    client_care_plans?: {
      client_id: string;
      title: string;
      clients?: {
        first_name: string;
        last_name: string;
        branch_id: string;
      };
    };
  };
  administered_by_staff?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface MARFormData {
  medication_id: string;
  administered_at: string;
  administered_by: string;
  status: 'given' | 'refused' | 'not_given' | 'not_applicable';
  notes?: string;
}

// Hook to fetch MAR records for a medication with enhanced data
export function useMARByMedication(medicationId: string, dateRange?: { start: string; end: string }) {
  return useQuery({
    queryKey: ['mar', medicationId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('medication_administration_records')
        .select(`
          *,
          client_medications(
            name,
            dosage,
            client_care_plans(
              client_id,
              title,
              clients(
                first_name,
                last_name,
                branch_id
              )
            )
          ),
          administered_by_staff:staff!administered_by(
            id,
            first_name,
            last_name
          )
        `)
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

// Hook to fetch MAR records for a client with enhanced data
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
              client_id,
              title,
              clients(
                first_name,
                last_name
              )
            )
          ),
          administered_by_staff:staff!administered_by(
            id,
            first_name,
            last_name
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
      return data as MedicationAdministrationRecord[];
    },
    enabled: !!clientId,
  });
}

// Enhanced hook to record medication administration with staff integration
export function useRecordMedicationAdministration() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (marData: Omit<MARFormData, 'administered_by'> & { administered_by?: string }) => {
      // Get current staff member info if not provided
      let administeredBy = marData.administered_by;
      
      if (!administeredBy && user) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        if (staffData) {
          administeredBy = `${staffData.first_name} ${staffData.last_name}`;
        } else {
          administeredBy = user.email || 'Unknown Staff';
        }
      }

      const { data, error } = await supabase
        .from('medication_administration_records')
        .insert({
          ...marData,
          administered_by: administeredBy || 'Unknown Staff'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      // Invalidate related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['mar'] });
      queryClient.invalidateQueries({ queryKey: ['medications'] });
      queryClient.invalidateQueries({ queryKey: ['medication-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-medications'] });
      
      toast.success('Medication administration recorded successfully');
      
      // Trigger real-time updates for other users
      supabase.channel('medication-updates').send({
        type: 'broadcast',
        event: 'medication-administered',
        payload: { medicationId: data.medication_id, status: data.status }
      });
    },
    onError: (error) => {
      console.error('Error recording medication administration:', error);
      toast.error('Failed to record medication administration');
    },
  });
}

// Enhanced hook to get pending medications with better filtering
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
            title,
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
        (data || []).map(async (medication) => {
          const { data: marData } = await supabase
            .from('medication_administration_records')
            .select('status, administered_at')
            .eq('medication_id', medication.id)
            .gte('administered_at', today)
            .lt('administered_at', `${today}T23:59:59`)
            .order('administered_at', { ascending: false })
            .limit(1);

          const todayRecord = marData?.[0];
          return {
            ...medication,
            administration_status: todayRecord?.status || 'pending',
            last_administered: todayRecord?.administered_at
          };
        })
      );

      return medicationsWithStatus.filter(med => med.administration_status === 'pending');
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// Hook for real-time medication updates
export function useRealTimeMedicationUpdates(branchId?: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['realtime-medication-setup', branchId],
    queryFn: async () => {
      const channel = supabase.channel('medication-updates');
      
      channel
        .on('broadcast', { event: 'medication-administered' }, (payload) => {
          // Invalidate queries when medications are administered
          queryClient.invalidateQueries({ queryKey: ['mar'] });
          queryClient.invalidateQueries({ queryKey: ['medication-stats'] });
          queryClient.invalidateQueries({ queryKey: ['pending-medications'] });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'medication_administration_records'
        }, (payload) => {
          console.log('Medication administration change:', payload);
          queryClient.invalidateQueries({ queryKey: ['mar'] });
          queryClient.invalidateQueries({ queryKey: ['medication-stats'] });
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'client_medications'
        }, (payload) => {
          console.log('Medication change:', payload);
          queryClient.invalidateQueries({ queryKey: ['medications'] });
          queryClient.invalidateQueries({ queryKey: ['pending-medications'] });
        })
        .subscribe();

      return channel;
    },
    staleTime: Infinity,
  });
}
