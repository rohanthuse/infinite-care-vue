
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

interface CarerPerformance {
  carerName: string;
  carerId: string;
  missedCalls: number;
  lateArrivals: number;
  totalBookings: number;
  reliabilityPercentage: number;
}

interface MedicationAdministration {
  clientName: string;
  clientId: string;
  medicationName: string;
  dosage: string;
  administrationMethod: string;
  administeredAt: string;
  status: string;
  administrationNotes: string;
  missedReason: string;
  sideEffectsObserved: string;
  administeredByName: string;
}

interface MedicationSummary {
  totalMedications: number;
  administeredCount: number;
  missedCount: number;
  administrationRate: number;
}

export interface ComplianceReportsData {
  trainingCompliance: TrainingCompliance[];
  incidentTypes: IncidentType[];
  complianceTrends: ComplianceTrend[];
  carerPerformance: CarerPerformance[];
  medicationAdministration: MedicationAdministration[];
  medicationSummary: MedicationSummary;
}

export const useComplianceReportsData = ({ branchId, startDate, endDate }: ComplianceReportsDataParams) => {
  return useQuery({
    queryKey: ['enhanced-compliance-reports-data', branchId, startDate, endDate],
    queryFn: async (): Promise<ComplianceReportsData> => {
      const { data, error } = await supabase.rpc('get_enhanced_compliance_reports_data', {
        p_branch_id: branchId,
        p_start_date: startDate || null,
        p_end_date: endDate || null
      });

      if (error) {
        console.error('Error fetching enhanced compliance reports data:', error);
        throw error;
      }

      return (data as unknown) as ComplianceReportsData;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};
