
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface MedicationTrendData {
  date: string;
  administered: number;
  missed: number;
  refused: number;
}

export interface MedicationTypeData {
  name: string;
  value: number;
}

export interface TimeOfDayData {
  name: string;
  administered: number;
  total: number;
}

// Hook to fetch medication administration trends for the last 7 days
// Combines data from both medication_administration_records AND visit_medications for accuracy
export function useMedicationTrendData(branchId?: string) {
  return useQuery({
    queryKey: ['medication-trend-data', branchId],
    queryFn: async () => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'EEE'),
          fullDate: format(date, 'yyyy-MM-dd'),
          start: startOfDay(date).toISOString(),
          end: endOfDay(date).toISOString()
        };
      });

      const trendData: MedicationTrendData[] = await Promise.all(
        days.map(async (day) => {
          // Query 1: medication_administration_records (primary source)
          let marQuery = supabase
            .from('medication_administration_records')
            .select(`
              status,
              client_medications!inner(
                client_care_plans!inner(
                  clients!inner(branch_id)
                )
              )
            `)
            .gte('administered_at', day.start)
            .lte('administered_at', day.end);

          if (branchId) {
            marQuery = marQuery.eq('client_medications.client_care_plans.clients.branch_id', branchId);
          }

          // Query 2: visit_medications (secondary source for data not synced to MAR)
          let visitMedQuery = supabase
            .from('visit_medications')
            .select(`
              is_administered,
              missed_reason,
              medication_id,
              visit_records!inner(
                client_id,
                clients!inner(branch_id)
              )
            `)
            .gte('administration_time', day.start)
            .lte('administration_time', day.end)
            .eq('is_administered', true);

          if (branchId) {
            visitMedQuery = visitMedQuery.eq('visit_records.clients.branch_id', branchId);
          }

          const [marResult, visitMedResult] = await Promise.all([marQuery, visitMedQuery]);
          
          if (marResult.error) {
            console.error('Error fetching MAR trend data:', marResult.error);
          }
          if (visitMedResult.error) {
            console.error('Error fetching visit medication trend data:', visitMedResult.error);
          }

          // Count from MAR records
          const marData = marResult.data || [];
          const marAdministered = marData.filter(record => record.status === 'given').length;
          const marMissed = marData.filter(record => record.status === 'not_given').length;
          const marRefused = marData.filter(record => record.status === 'refused').length;

          // Count additional from visit_medications that don't have medication_id (not synced to MAR)
          const visitMedData = visitMedResult.data || [];
          const visitOnlyAdministered = visitMedData.filter(vm => !vm.medication_id && vm.is_administered).length;
          const visitOnlyMissed = visitMedData.filter(vm => !vm.medication_id && !vm.is_administered && vm.missed_reason).length;

          return {
            date: day.date,
            administered: marAdministered + visitOnlyAdministered,
            missed: marMissed + visitOnlyMissed,
            refused: marRefused
          };
        })
      );

      return trendData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook to fetch medication type distribution
export function useMedicationTypeDistribution(branchId?: string) {
  return useQuery({
    queryKey: ['medication-type-distribution', branchId],
    queryFn: async () => {
      let query = supabase
        .from('client_medications')
        .select(`
          name,
          client_care_plans!inner(
            clients!inner(branch_id)
          )
        `)
        .eq('status', 'active');

      if (branchId) {
        query = query.eq('client_care_plans.clients.branch_id', branchId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching medication types:', error);
        return [];
      }

      // Group medications by type/category
      const typeMap = new Map<string, number>();
      
      data?.forEach((medication) => {
        const name = medication.name.toLowerCase();
        let category = 'Others';
        
        // Simple categorization based on medication names
        if (name.includes('paracetamol') || name.includes('ibuprofen') || name.includes('aspirin') || name.includes('codeine')) {
          category = 'Analgesics';
        } else if (name.includes('amoxicillin') || name.includes('penicillin') || name.includes('antibiotic')) {
          category = 'Antibiotics';
        } else if (name.includes('metformin') || name.includes('insulin') || name.includes('diabetes')) {
          category = 'Antidiabetics';
        } else if (name.includes('amlodipine') || name.includes('lisinopril') || name.includes('blood pressure')) {
          category = 'Antihypertensives';
        }
        
        typeMap.set(category, (typeMap.get(category) || 0) + 1);
      });

      const typeData: MedicationTypeData[] = Array.from(typeMap.entries()).map(([name, value]) => ({
        name,
        value
      }));

      return typeData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

// Hook to fetch time of day distribution
export function useTimeOfDayDistribution(branchId?: string) {
  return useQuery({
    queryKey: ['time-of-day-distribution', branchId],
    queryFn: async () => {
      const today = new Date();
      const startOfToday = startOfDay(today).toISOString();
      const endOfToday = endOfDay(today).toISOString();

      let adminQuery = supabase
        .from('medication_administration_records')
        .select(`
          administered_at,
          status,
          client_medications!inner(
            client_care_plans!inner(
              clients!inner(branch_id)
            )
          )
        `)
        .gte('administered_at', startOfToday)
        .lte('administered_at', endOfToday);

      let totalQuery = supabase
        .from('client_medications')
        .select(`
          frequency,
          client_care_plans!inner(
            clients!inner(branch_id)
          )
        `)
        .eq('status', 'active');

      if (branchId) {
        adminQuery = adminQuery.eq('client_medications.client_care_plans.clients.branch_id', branchId);
        totalQuery = totalQuery.eq('client_care_plans.clients.branch_id', branchId);
      }

      const [adminResult, totalResult] = await Promise.all([
        adminQuery,
        totalQuery
      ]);

      if (adminResult.error || totalResult.error) {
        console.error('Error fetching time distribution:', adminResult.error || totalResult.error);
        return [];
      }

      // Categorize by time of day
      const timeSlots = {
        Morning: { administered: 0, total: 0 },
        Afternoon: { administered: 0, total: 0 },
        Evening: { administered: 0, total: 0 },
        Night: { administered: 0, total: 0 }
      };

      // Count administered medications by time
      adminResult.data?.forEach((record) => {
        if (record.status === 'given') {
          const hour = new Date(record.administered_at).getHours();
          if (hour >= 6 && hour < 12) {
            timeSlots.Morning.administered++;
          } else if (hour >= 12 && hour < 18) {
            timeSlots.Afternoon.administered++;
          } else if (hour >= 18 && hour < 22) {
            timeSlots.Evening.administered++;
          } else {
            timeSlots.Night.administered++;
          }
        }
      });

      // Estimate total medications by frequency
      totalResult.data?.forEach((medication) => {
        const frequency = medication.frequency.toLowerCase();
        let dailyDoses = 1;
        
        if (frequency.includes('twice') || frequency.includes('2')) {
          dailyDoses = 2;
        } else if (frequency.includes('three') || frequency.includes('3')) {
          dailyDoses = 3;
        } else if (frequency.includes('four') || frequency.includes('4')) {
          dailyDoses = 4;
        }

        // Distribute doses across time slots
        if (dailyDoses === 1) {
          timeSlots.Morning.total++;
        } else if (dailyDoses === 2) {
          timeSlots.Morning.total++;
          timeSlots.Evening.total++;
        } else if (dailyDoses === 3) {
          timeSlots.Morning.total++;
          timeSlots.Afternoon.total++;
          timeSlots.Evening.total++;
        } else if (dailyDoses === 4) {
          timeSlots.Morning.total++;
          timeSlots.Afternoon.total++;
          timeSlots.Evening.total++;
          timeSlots.Night.total++;
        }
      });

      const timeData: TimeOfDayData[] = Object.entries(timeSlots).map(([name, data]) => ({
        name,
        administered: data.administered,
        total: data.total
      }));

      return timeData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}
