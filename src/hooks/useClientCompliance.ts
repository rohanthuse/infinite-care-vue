import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientComplianceData {
  clientId: string;
  overallScore: number;
  medicationCompliance: {
    totalMedications: number;
    administeredOnTime: number;
    missed: number;
    late: number;
    complianceRate: number;
  };
  visitCompliance: {
    totalVisits: number;
    completedVisits: number;
    missedVisits: number;
    complianceRate: number;
  };
  appointmentCompliance: {
    totalAppointments: number;
    attended: number;
    missed: number;
    cancelled: number;
    complianceRate: number;
  };
  healthMonitoring: {
    totalReadings: number;
    completedReadings: number;
    missedReadings: number;
    complianceRate: number;
    lastReadingDate: string | null;
  };
}

export const useClientCompliance = (clientId: string) => {
  return useQuery({
    queryKey: ['client-compliance', clientId],
    queryFn: async (): Promise<ClientComplianceData> => {
      // Fetch medication compliance
      const { data: medications, error: medError } = await supabase
        .from('visit_medications')
        .select('*, visit_records!inner(client_id)')
        .eq('visit_records.client_id', clientId);

      if (medError) throw medError;

      const totalMedications = medications?.length || 0;
      const administeredOnTime = medications?.filter(
        (m) => m.is_administered && !m.administration_notes?.includes('late')
      ).length || 0;
      const missed = medications?.filter((m) => !m.is_administered).length || 0;
      const late = medications?.filter(
        (m) => m.is_administered && m.administration_notes?.includes('late')
      ).length || 0;
      const medicationComplianceRate = totalMedications > 0
        ? (administeredOnTime / totalMedications) * 100
        : 100;

      // Fetch visit compliance
      const { data: visits, error: visitsError } = await supabase
        .from('visit_records')
        .select('*')
        .eq('client_id', clientId);

      if (visitsError) throw visitsError;

      const totalVisits = visits?.length || 0;
      const completedVisits = visits?.filter((v) => v.status === 'completed').length || 0;
      const missedVisits = visits?.filter((v) => v.status === 'missed').length || 0;
      const visitComplianceRate = totalVisits > 0
        ? (completedVisits / totalVisits) * 100
        : 100;

      // Fetch appointment compliance (from bookings)
      const { data: appointments, error: appointmentsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', clientId);

      if (appointmentsError) throw appointmentsError;

      const totalAppointments = appointments?.length || 0;
      const attended = appointments?.filter((a) => a.status === 'confirmed').length || 0;
      const cancelled = appointments?.filter((a) => a.status === 'cancelled').length || 0;
      const missedAppointments = appointments?.filter((a) => a.status === 'missed').length || 0;
      const appointmentComplianceRate = totalAppointments > 0
        ? (attended / totalAppointments) * 100
        : 100;

      // Fetch health monitoring compliance (visit vitals with NEWS2)
      const { data: healthReadings, error: healthError } = await supabase
        .from('visit_vitals')
        .select('*')
        .eq('client_id', clientId)
        .order('reading_time', { ascending: false });

      if (healthError) throw healthError;

      const totalReadings = healthReadings?.length || 0;
      const completedReadings = healthReadings?.filter((r) => r.news2_total_score !== null).length || 0;
      const missedReadings = totalReadings - completedReadings;
      const healthComplianceRate = totalReadings > 0
        ? (completedReadings / totalReadings) * 100
        : 100;
      const lastReadingDate = healthReadings?.[0]?.reading_time || null;

      // Calculate overall compliance score
      const overallScore = Math.round(
        (medicationComplianceRate + visitComplianceRate + appointmentComplianceRate + healthComplianceRate) / 4
      );

      return {
        clientId,
        overallScore,
        medicationCompliance: {
          totalMedications,
          administeredOnTime,
          missed,
          late,
          complianceRate: Math.round(medicationComplianceRate),
        },
        visitCompliance: {
          totalVisits,
          completedVisits,
          missedVisits,
          complianceRate: Math.round(visitComplianceRate),
        },
        appointmentCompliance: {
          totalAppointments,
          attended,
          missed: missedAppointments,
          cancelled,
          complianceRate: Math.round(appointmentComplianceRate),
        },
        healthMonitoring: {
          totalReadings,
          completedReadings,
          missedReadings,
          complianceRate: Math.round(healthComplianceRate),
          lastReadingDate,
        },
      };
    },
    enabled: !!clientId,
  });
};
