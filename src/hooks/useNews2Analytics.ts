
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export interface News2TrendData {
  date: string;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  totalPatients: number;
  averageScore: number;
}

export interface RiskDistributionData {
  name: string;
  value: number;
  color: string;
}

export interface PatientDeteriorationData {
  patientId: string;
  patientName: string;
  currentScore: number;
  previousScore: number;
  trend: 'improving' | 'stable' | 'deteriorating';
  lastObservation: string;
}

export const useNews2Analytics = (branchId?: string) => {
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ['news2-trends', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return {
          date: format(date, 'MMM dd'),
          fullDate: format(date, 'yyyy-MM-dd'),
          start: startOfDay(date).toISOString(),
          end: endOfDay(date).toISOString()
        };
      });

      const trendData: News2TrendData[] = await Promise.all(
        days.map(async (day) => {
          // Get observations for this day
          const { data: observations } = await supabase
            .from('news2_observations')
            .select(`
              total_score,
              news2_patients!inner(
                branch_id,
                client:clients(first_name, last_name)
              )
            `)
            .eq('news2_patients.branch_id', branchId)
            .gte('recorded_at', day.start)
            .lte('recorded_at', day.end);

          const scores = observations?.map(o => o.total_score) || [];
          const highRisk = scores.filter(s => s >= 7).length;
          const mediumRisk = scores.filter(s => s >= 5 && s < 7).length;
          const lowRisk = scores.filter(s => s < 5).length;
          const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

          return {
            date: day.date,
            highRisk,
            mediumRisk,
            lowRisk,
            totalPatients: scores.length,
            averageScore: Math.round(averageScore * 10) / 10
          };
        })
      );

      return trendData;
    },
    enabled: Boolean(branchId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: riskDistribution = [], isLoading: distributionLoading } = useQuery({
    queryKey: ['news2-risk-distribution', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      const { data: patients } = await supabase
        .from('news2_patients')
        .select(`
          *,
          latest_observation:news2_observations(total_score)
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true);

      const riskCounts = { high: 0, medium: 0, low: 0 };
      
      patients?.forEach(patient => {
        const score = patient.latest_observation?.[0]?.total_score || 0;
        if (score >= 7) riskCounts.high++;
        else if (score >= 5) riskCounts.medium++;
        else riskCounts.low++;
      });

      const distributionData: RiskDistributionData[] = [
        { name: 'High Risk (≥7)', value: riskCounts.high, color: '#ef4444' },
        { name: 'Medium Risk (5-6)', value: riskCounts.medium, color: '#f97316' },
        { name: 'Low Risk (<5)', value: riskCounts.low, color: '#22c55e' }
      ];

      return distributionData;
    },
    enabled: Boolean(branchId),
    staleTime: 2 * 60 * 1000,
  });

  const { data: deterioratingPatients = [], isLoading: deteriorationLoading } = useQuery({
    queryKey: ['news2-deterioration', branchId],
    queryFn: async () => {
      if (!branchId) return [];

      // Get patients with their latest two observations to calculate trends
      const { data: patients } = await supabase
        .from('news2_patients')
        .select(`
          id,
          client:clients(first_name, last_name),
          observations:news2_observations(
            total_score,
            recorded_at
          )
        `)
        .eq('branch_id', branchId)
        .eq('is_active', true);

      const deteriorationData: PatientDeteriorationData[] = [];

      patients?.forEach(patient => {
        const observations = patient.observations || [];
        if (observations.length >= 2) {
          // Sort by most recent first
          const sortedObs = observations.sort((a, b) => 
            new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
          );
          
          const current = sortedObs[0];
          const previous = sortedObs[1];
          
          let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
          if (current.total_score > previous.total_score) {
            trend = 'deteriorating';
          } else if (current.total_score < previous.total_score) {
            trend = 'improving';
          }

          // Only include deteriorating patients or high-risk patients
          if (trend === 'deteriorating' || current.total_score >= 7) {
            const clientData = Array.isArray(patient.client) ? patient.client[0] : patient.client;
            deteriorationData.push({
              patientId: patient.id,
              patientName: `${clientData?.first_name || ''} ${clientData?.last_name || ''}`.trim(),
              currentScore: current.total_score,
              previousScore: previous.total_score,
              trend,
              lastObservation: current.recorded_at
            });
          }
        }
      });

      return deteriorationData.sort((a, b) => b.currentScore - a.currentScore);
    },
    enabled: Boolean(branchId),
    staleTime: 1 * 60 * 1000, // 1 minute for more critical data
  });

  return {
    trendData,
    riskDistribution,
    deterioratingPatients,
    isLoading: trendLoading || distributionLoading || deteriorationLoading,
  };
};
