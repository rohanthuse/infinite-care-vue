
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBranchDashboardNavigation } from '@/hooks/useBranchDashboardNavigation';

export interface MARWeeklyStats {
  day: string;
  administered: number;
  missed: number;
  refused: number;
}

export interface MARTypeDistribution {
  name: string;
  value: number;
}

export interface MARTimeOfDayStats {
  name: string;
  administered: number;
  total: number;
}

export interface MARChartData {
  weeklyStats: MARWeeklyStats[];
  typeDistribution: MARTypeDistribution[];
  timeOfDayStats: MARTimeOfDayStats[];
}

export const useMARChartData = () => {
  const { id: branchId } = useBranchDashboardNavigation();

  return useQuery({
    queryKey: ['mar-chart-data', branchId],
    queryFn: async (): Promise<MARChartData> => {
      if (!branchId) throw new Error('Branch ID required');

      // Get last 7 days of administration data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      // Fetch weekly administration stats
      const { data: marRecords } = await supabase
        .from('medication_administration_records')
        .select(`
          administered_at,
          status,
          client_medications!inner(
            client_care_plans!inner(
              clients!inner(
                branch_id
              )
            )
          )
        `)
        .eq('client_medications.client_care_plans.clients.branch_id', branchId)
        .gte('administered_at', startDate.toISOString())
        .lte('administered_at', endDate.toISOString());

      // Generate weekly stats
      const weeklyStats: MARWeeklyStats[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const dayRecords = marRecords?.filter(record => {
          const recordDate = new Date(record.administered_at);
          return recordDate.toDateString() === date.toDateString();
        }) || [];

        weeklyStats.push({
          day: dayStr,
          administered: dayRecords.filter(r => r.status === 'given').length,
          missed: dayRecords.filter(r => r.status === 'not_given').length,
          refused: dayRecords.filter(r => r.status === 'refused').length,
        });
      }

      // Fetch medication types distribution
      const { data: medications } = await supabase
        .from('client_medications')
        .select(`
          name,
          client_care_plans!inner(
            clients!inner(
              branch_id
            )
          )
        `)
        .eq('client_care_plans.clients.branch_id', branchId)
        .eq('status', 'active');

      // Group medications by type/category
      const medicationCounts: Record<string, number> = {};
      medications?.forEach(med => {
        const name = med.name.toLowerCase();
        let category = 'Others';
        
        if (name.includes('lisinopril') || name.includes('amlodipine') || name.includes('metoprolol')) {
          category = 'Antihypertensives';
        } else if (name.includes('metformin') || name.includes('insulin') || name.includes('glyburide')) {
          category = 'Antidiabetics';
        } else if (name.includes('ibuprofen') || name.includes('acetaminophen') || name.includes('aspirin')) {
          category = 'Analgesics';
        } else if (name.includes('amoxicillin') || name.includes('azithromycin') || name.includes('ciprofloxacin')) {
          category = 'Antibiotics';
        }
        
        medicationCounts[category] = (medicationCounts[category] || 0) + 1;
      });

      const typeDistribution: MARTypeDistribution[] = Object.entries(medicationCounts)
        .map(([name, value]) => ({ name, value }));

      // Generate time of day stats based on medication schedules
      const timeOfDayStats: MARTimeOfDayStats[] = [
        { name: 'Morning', administered: 0, total: 0 },
        { name: 'Afternoon', administered: 0, total: 0 },
        { name: 'Evening', administered: 0, total: 0 },
        { name: 'Night', administered: 0, total: 0 },
      ];

      // Calculate based on today's expected vs actual administration
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRecords } = await supabase
        .from('medication_administration_records')
        .select(`
          administered_at,
          status,
          client_medications!inner(
            frequency,
            client_care_plans!inner(
              clients!inner(
                branch_id
              )
            )
          )
        `)
        .eq('client_medications.client_care_plans.clients.branch_id', branchId)
        .gte('administered_at', `${today}T00:00:00`)
        .lt('administered_at', `${today}T23:59:59`);

      // Categorize by time of day
      todayRecords?.forEach(record => {
        const hour = new Date(record.administered_at).getHours();
        let timeSlot: string;
        
        if (hour >= 6 && hour < 12) timeSlot = 'Morning';
        else if (hour >= 12 && hour < 17) timeSlot = 'Afternoon';
        else if (hour >= 17 && hour < 22) timeSlot = 'Evening';
        else timeSlot = 'Night';

        const slot = timeOfDayStats.find(s => s.name === timeSlot);
        if (slot) {
          slot.total++;
          if (record.status === 'given') {
            slot.administered++;
          }
        }
      });

      // If no records exist, show potential based on active medications
      if (!todayRecords?.length && medications?.length) {
        // Estimate based on typical medication schedules
        medications.forEach(med => {
          const freq = med.client_care_plans?.clients ? 1 : 0;
          if (freq > 0) {
            timeOfDayStats[0].total += Math.ceil(freq / 2); // Morning
            timeOfDayStats[1].total += Math.floor(freq / 3); // Afternoon
            timeOfDayStats[2].total += Math.ceil(freq / 2); // Evening
            timeOfDayStats[3].total += Math.floor(freq / 4); // Night
          }
        });
      }

      return {
        weeklyStats,
        typeDistribution,
        timeOfDayStats,
      };
    },
    enabled: !!branchId,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
