
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PatientWithMedications {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  avatar_initials?: string;
  medication_count: number;
  last_updated: string;
  status: string;
}

// Hook to fetch patients with their medication counts
export function usePatientsWithMedications(branchId?: string) {
  return useQuery({
    queryKey: ['patients', 'with-medications', branchId],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          gender,
          avatar_initials,
          status,
          created_at,
          client_care_plans(
            id,
            client_medications(
              id,
              updated_at
            )
          )
        `);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to include medication count and last updated
      const patientsWithMedications: PatientWithMedications[] = data
        .map(patient => {
          const allMedications = patient.client_care_plans.flatMap(cp => cp.client_medications);
          const lastUpdated = allMedications.length > 0 
            ? new Date(Math.max(...allMedications.map(med => new Date(med.updated_at).getTime())))
            : new Date(patient.created_at);

          return {
            id: patient.id,
            first_name: patient.first_name,
            last_name: patient.last_name,
            email: patient.email,
            phone: patient.phone,
            date_of_birth: patient.date_of_birth,
            gender: patient.gender,
            avatar_initials: patient.avatar_initials || `${patient.first_name[0]}${patient.last_name[0]}`,
            medication_count: allMedications.length,
            last_updated: lastUpdated.toLocaleDateString(),
            status: patient.status || 'Active'
          };
        })
        .filter(patient => patient.medication_count > 0) // Only include patients with medications
        .sort((a, b) => b.medication_count - a.medication_count);

      return patientsWithMedications;
    },
  });
}

// Hook to get medication statistics for a branch
export function useMedicationStats(branchId?: string) {
  return useQuery({
    queryKey: ['medication-stats', branchId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Get total medications
      let totalQuery = supabase
        .from('client_medications')
        .select('id', { count: 'exact' })
        .eq('status', 'active');

      if (branchId) {
        totalQuery = totalQuery
          .select(`
            id,
            client_care_plans!inner(
              clients!inner(
                branch_id
              )
            )
          `, { count: 'exact' })
          .eq('client_care_plans.clients.branch_id', branchId);
      }

      const { count: totalMedications } = await totalQuery;

      // Get today's administration records
      let marQuery = supabase
        .from('medication_administration_records')
        .select(`
          id,
          status,
          client_medications!inner(
            id,
            client_care_plans!inner(
              clients!inner(
                branch_id
              )
            )
          )
        `)
        .gte('administered_at', today)
        .lt('administered_at', `${today}T23:59:59`);

      if (branchId) {
        marQuery = marQuery.eq('client_medications.client_care_plans.clients.branch_id', branchId);
      }

      const { data: marRecords } = await marQuery;

      const administeredToday = marRecords?.filter(record => record.status === 'given').length || 0;
      const missedDoses = marRecords?.filter(record => record.status === 'not_given').length || 0;
      const dueToday = (totalMedications || 0) - (marRecords?.length || 0);

      return {
        totalMedications: totalMedications || 0,
        dueToday,
        administeredToday,
        missedDoses
      };
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
