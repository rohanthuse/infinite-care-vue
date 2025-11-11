import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientComplianceRow {
  clientId: string;
  clientName: string;
  medicationCompliancePercentage: number;
  visitCompliancePercentage: number;
  appointmentAdherencePercentage: number;
  healthMonitoringPercentage: number;
  overallScore: number;
  complianceLevel: 'compliant' | 'at-risk' | 'non-compliant';
  totalVisits: number;
  completedVisits: number;
  missedMedications: number;
  missedAppointments: number;
}

export interface ClientComplianceMatrixData {
  clientRows: ClientComplianceRow[];
  summary: {
    totalClients: number;
    compliantClients: number;
    atRiskClients: number;
    nonCompliantClients: number;
    averageComplianceScore: number;
    totalMedicationAdministrations: number;
    totalMissedMedications: number;
    totalVisitsCompleted: number;
    totalVisitsMissed: number;
  };
  trends: {
    month: string;
    averageScore: number;
    medicationCompliance: number;
    visitCompliance: number;
  }[];
}

interface UseClientComplianceMatrixProps {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

export const useClientComplianceMatrix = ({
  branchId,
  startDate,
  endDate,
}: UseClientComplianceMatrixProps) => {
  return useQuery({
    queryKey: ['client-compliance-matrix', branchId, startDate, endDate],
    queryFn: async (): Promise<ClientComplianceMatrixData> => {
      console.log('[useClientComplianceMatrix] Fetching data for branch:', branchId);

      // Fetch all clients for the branch
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, branch_id')
        .eq('branch_id', branchId);

      if (clientsError) throw clientsError;

      if (!clients || clients.length === 0) {
        return {
          clientRows: [],
          summary: {
            totalClients: 0,
            compliantClients: 0,
            atRiskClients: 0,
            nonCompliantClients: 0,
            averageComplianceScore: 0,
            totalMedicationAdministrations: 0,
            totalMissedMedications: 0,
            totalVisitsCompleted: 0,
            totalVisitsMissed: 0,
          },
          trends: [],
        };
      }

      // Fetch compliance data for all clients in parallel
      const clientCompliancePromises = clients.map(async (client) => {
        const clientId = client.id;
        const clientName = `${client.first_name} ${client.last_name}`;

        // Fetch medication records (join with visit_records to get client_id)
        const { data: medications } = await supabase
          .from('visit_medications')
          .select(`
            is_administered,
            missed_reason,
            visit_record:visit_records!inner(client_id)
          `)
          .eq('visit_record.client_id', clientId);

        // Fetch visit records
        const { data: visits } = await supabase
          .from('visit_records')
          .select('status, visit_start_time, visit_end_time')
          .eq('client_id', clientId);

        // Fetch bookings (for appointments)
        const { data: bookings } = await supabase
          .from('bookings')
          .select('status, start_time, end_time')
          .eq('client_id', clientId);

        // Fetch vitals (for health monitoring)
        const { data: vitals } = await supabase
          .from('visit_vitals')
          .select('recorded_at')
          .eq('client_id', clientId);

        // Calculate medication compliance
        const totalMedications = (medications || []).length;
        const administeredMeds = (medications || []).filter(
          (m) => m.is_administered === true
        ).length;
        const missedMeds = (medications || []).filter(
          (m) => m.missed_reason !== null && m.missed_reason !== ''
        ).length;

        const medicationCompliancePercentage =
          totalMedications > 0
            ? Math.round((administeredMeds / totalMedications) * 100)
            : 100;

        // Calculate visit compliance
        const totalVisits = (visits || []).length;
        const completedVisits = (visits || []).filter(
          (v) => v.visit_end_time !== null
        ).length;

        const visitCompliancePercentage =
          totalVisits > 0
            ? Math.round((completedVisits / totalVisits) * 100)
            : 100;

        // Calculate appointment adherence (bookings that were not cancelled)
        const totalAppointments = (bookings || []).length;
        const completedAppointments = (bookings || []).filter(
          (b) => b.status !== 'cancelled' && b.status !== 'no-show'
        ).length;

        const appointmentAdherencePercentage =
          totalAppointments > 0
            ? Math.round((completedAppointments / totalAppointments) * 100)
            : 100;

        // Calculate health monitoring compliance
        // Check if vitals are being recorded regularly (at least one per visit)
        const expectedVitals = completedVisits;
        const recordedVitals = (vitals || []).length;

        const healthMonitoringPercentage =
          expectedVitals > 0
            ? Math.round(Math.min((recordedVitals / expectedVitals) * 100, 100))
            : 100;

        // Calculate overall score (weighted average)
        const overallScore = Math.round(
          medicationCompliancePercentage * 0.35 +
            visitCompliancePercentage * 0.25 +
            appointmentAdherencePercentage * 0.25 +
            healthMonitoringPercentage * 0.15
        );

        // Determine compliance level
        let complianceLevel: 'compliant' | 'at-risk' | 'non-compliant' = 'compliant';
        if (overallScore < 70) {
          complianceLevel = 'non-compliant';
        } else if (overallScore < 85) {
          complianceLevel = 'at-risk';
        }

        return {
          clientId,
          clientName,
          medicationCompliancePercentage,
          visitCompliancePercentage,
          appointmentAdherencePercentage,
          healthMonitoringPercentage,
          overallScore,
          complianceLevel,
          totalVisits,
          completedVisits,
          missedMedications: missedMeds,
          missedAppointments: totalAppointments - completedAppointments,
        };
      });

      const clientRows = await Promise.all(clientCompliancePromises);

      // Calculate summary
      const totalClients = clientRows.length;
      const compliantClients = clientRows.filter((c) => c.complianceLevel === 'compliant').length;
      const atRiskClients = clientRows.filter((c) => c.complianceLevel === 'at-risk').length;
      const nonCompliantClients = clientRows.filter((c) => c.complianceLevel === 'non-compliant').length;
      const averageComplianceScore =
        totalClients > 0
          ? Math.round(clientRows.reduce((sum, c) => sum + c.overallScore, 0) / totalClients)
          : 0;

      const totalMedicationAdministrations = clientRows.reduce(
        (sum, c) => sum + (c.medicationCompliancePercentage / 100) * c.totalVisits,
        0
      );
      const totalMissedMedications = clientRows.reduce((sum, c) => sum + c.missedMedications, 0);
      const totalVisitsCompleted = clientRows.reduce((sum, c) => sum + c.completedVisits, 0);
      const totalVisitsMissed = clientRows.reduce(
        (sum, c) => sum + (c.totalVisits - c.completedVisits),
        0
      );

      // Generate trend data (simplified - last 6 months)
      const trends = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

        // Simplified: use current average scores
        const avgMedicationCompliance =
          totalClients > 0
            ? Math.round(
                clientRows.reduce((sum, c) => sum + c.medicationCompliancePercentage, 0) / totalClients
              )
            : 0;

        const avgVisitCompliance =
          totalClients > 0
            ? Math.round(
                clientRows.reduce((sum, c) => sum + c.visitCompliancePercentage, 0) / totalClients
              )
            : 0;

        trends.push({
          month: monthName,
          averageScore: averageComplianceScore,
          medicationCompliance: avgMedicationCompliance,
          visitCompliance: avgVisitCompliance,
        });
      }

      console.log('[useClientComplianceMatrix] Processed', totalClients, 'clients');

      return {
        clientRows,
        summary: {
          totalClients,
          compliantClients,
          atRiskClients,
          nonCompliantClients,
          averageComplianceScore,
          totalMedicationAdministrations: Math.round(totalMedicationAdministrations),
          totalMissedMedications,
          totalVisitsCompleted,
          totalVisitsMissed,
        },
        trends,
      };
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
