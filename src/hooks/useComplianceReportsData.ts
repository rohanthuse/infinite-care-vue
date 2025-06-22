
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ComplianceReportsDataParams {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

interface TrainingCompliance {
  name: string;
  compliant: number;
  noncompliant: number;
}

interface IncidentType {
  name: string;
  value: number;
}

interface ComplianceTrend {
  month: string;
  incidents: number;
}

export interface ComplianceReportsData {
  trainingCompliance: TrainingCompliance[];
  incidentTypes: IncidentType[];
  complianceTrends: ComplianceTrend[];
}

export const useComplianceReportsData = ({ branchId, startDate, endDate }: ComplianceReportsDataParams) => {
  return useQuery({
    queryKey: ['compliance-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<ComplianceReportsData> => {
      const { data, error } = await supabase.rpc('get_compliance_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching compliance reports data:', error);
        throw error;
      }

      return (data as unknown) as ComplianceReportsData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};
