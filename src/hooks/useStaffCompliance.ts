import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingComplianceItem {
  courseTitle: string;
  status: 'compliant' | 'expiring-soon' | 'expired' | 'not-started';
  completionDate: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
}

export interface MissedCallItem {
  bookingId: string;
  clientName: string;
  scheduledDate: string;
  reason: string | null;
}

export interface LateArrivalItem {
  bookingId: string;
  clientName: string;
  scheduledTime: string;
  actualArrivalTime: string;
  minutesLate: number;
}

export interface IncidentLogItem {
  id: string;
  incidentType: string;
  description: string;
  reportedDate: string;
}

export interface DocumentExpiryItem {
  documentType: string;
  status: 'valid' | 'expiring-soon' | 'expired' | 'missing';
  expiryDate: string | null;
  daysUntilExpiry: number | null;
}

export interface StaffComplianceData {
  overallScore: number;
  trainingCompliance: {
    compliantCount: number;
    totalRequired: number;
    percentage: number;
    items: TrainingComplianceItem[];
  };
  missedCalls: {
    count: number;
    items: MissedCallItem[];
  };
  lateArrivals: {
    count: number;
    averageMinutesLate: number;
    items: LateArrivalItem[];
  };
  incidents: {
    count: number;
    items: IncidentLogItem[];
  };
  documents: {
    validCount: number;
    expiringCount: number;
    expiredCount: number;
    items: DocumentExpiryItem[];
  };
}

const calculateDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const useStaffCompliance = (staffId?: string) => {
  return useQuery({
    queryKey: ['staff-compliance', staffId],
    queryFn: async (): Promise<StaffComplianceData> => {
      if (!staffId) {
        throw new Error('Staff ID is required');
      }

      // Fetch training records
      const { data: trainingRecords, error: trainingError } = await supabase
        .from('staff_training_records')
        .select(`
          *,
          training_course:training_courses!inner(
            id, title, is_mandatory, valid_for_months
          )
        `)
        .eq('staff_id', staffId);

      if (trainingError) throw trainingError;

      // Fetch bookings for missed calls
      const { data: bookings, error: bookingsError} = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          client:clients!inner(
            id,
            first_name,
            last_name
          )
        `)
        .eq('staff_id', staffId)
        .order('start_time', { ascending: false })
        .limit(100);

      if (bookingsError) throw bookingsError;

      // Fetch visit records
      const { data: visitRecords, error: visitError } = await supabase
        .from('visit_records')
        .select('id, visit_notes, visit_start_time, created_at')
        .eq('staff_id', staffId)
        .not('visit_notes', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (visitError) throw visitError;

      // Fetch documents
      const { data: documents, error: documentsError } = await supabase
        .from('staff_documents')
        .select('*')
        .eq('staff_id', staffId);

      if (documentsError) throw documentsError;

      // Process training compliance
      const trainingItems: TrainingComplianceItem[] = (trainingRecords || []).map(record => {
        const daysUntilExpiry = calculateDaysUntilExpiry(record.expiry_date);
        let status: TrainingComplianceItem['status'] = 'not-started';
        
        if (record.status === 'completed') {
          if (record.expiry_date) {
            if (daysUntilExpiry !== null) {
              if (daysUntilExpiry < 0) {
                status = 'expired';
              } else if (daysUntilExpiry <= 30) {
                status = 'expiring-soon';
              } else {
                status = 'compliant';
              }
            } else {
              status = 'compliant';
            }
          } else {
            status = 'compliant';
          }
        } else if (record.status === 'expired') {
          status = 'expired';
        }

        return {
          courseTitle: record.training_course?.title || 'Unknown Course',
          status,
          completionDate: record.completion_date,
          expiryDate: record.expiry_date,
          daysUntilExpiry,
        };
      });

      const mandatoryTraining = trainingRecords?.filter(r => r.training_course?.is_mandatory) || [];
      const compliantTraining = trainingItems.filter(t => t.status === 'compliant').length;

      // Process missed calls (cancelled bookings)
      const missedCallsData = (bookings || [])
        .filter(b => b.status === 'cancelled')
        .slice(0, 20)
        .map(b => ({
          bookingId: b.id,
          clientName: `${b.client?.first_name || ''} ${b.client?.last_name || ''}`.trim(),
          scheduledDate: b.start_time,
          reason: b.notes || 'No reason provided',
        }));

      // For late arrivals, use attendance records instead since bookings don't have actual_start_time
      const lateArrivalsData: LateArrivalItem[] = [];
      const avgMinutesLate = 0;

      // Process incidents from visit records (look for any concerning notes)
      const incidentsData = (visitRecords || [])
        .filter(record => 
          record.visit_notes && (
            record.visit_notes.toLowerCase().includes('incident') ||
            record.visit_notes.toLowerCase().includes('issue') ||
            record.visit_notes.toLowerCase().includes('concern')
          )
        )
        .map(record => ({
          id: record.id,
          incidentType: 'Visit Note',
          description: record.visit_notes || 'No details provided',
          reportedDate: record.visit_start_time || record.created_at || '',
        }))
        .slice(0, 20);

      // Process documents
      const documentItems: DocumentExpiryItem[] = (documents || []).map(doc => {
        const daysUntilExpiry = calculateDaysUntilExpiry(doc.expiry_date);
        let status: DocumentExpiryItem['status'] = 'valid';
        
        if (doc.expiry_date) {
          if (daysUntilExpiry !== null) {
            if (daysUntilExpiry < 0) {
              status = 'expired';
            } else if (daysUntilExpiry <= 30) {
              status = 'expiring-soon';
            }
          }
        } else if (doc.status === 'expired') {
          status = 'expired';
        }

        return {
          documentType: doc.document_type || 'Unknown Document',
          status,
          expiryDate: doc.expiry_date,
          daysUntilExpiry,
        };
      });

      const validDocs = documentItems.filter(d => d.status === 'valid').length;
      const expiringDocs = documentItems.filter(d => d.status === 'expiring-soon').length;
      const expiredDocs = documentItems.filter(d => d.status === 'expired').length;

      // Calculate overall compliance score (0-100)
      const trainingScore = mandatoryTraining.length > 0 
        ? (compliantTraining / mandatoryTraining.length) * 100 
        : 100;
      const documentScore = documentItems.length > 0
        ? ((validDocs + expiringDocs * 0.5) / documentItems.length) * 100
        : 100;
      const incidentPenalty = Math.min(incidentsData.length * 5, 20);
      const missedCallPenalty = Math.min(missedCallsData.length * 5, 20);
      const lateArrivalPenalty = Math.min(lateArrivalsData.length * 3, 20);

      const overallScore = Math.max(0, Math.round(
        (trainingScore * 0.4 + documentScore * 0.3) - 
        (incidentPenalty + missedCallPenalty + lateArrivalPenalty)
      ));

      return {
        overallScore,
        trainingCompliance: {
          compliantCount: compliantTraining,
          totalRequired: mandatoryTraining.length,
          percentage: mandatoryTraining.length > 0 
            ? Math.round((compliantTraining / mandatoryTraining.length) * 100)
            : 100,
          items: trainingItems,
        },
        missedCalls: {
          count: missedCallsData.length,
          items: missedCallsData,
        },
        lateArrivals: {
          count: lateArrivalsData.length,
          averageMinutesLate: avgMinutesLate,
          items: lateArrivalsData,
        },
        incidents: {
          count: incidentsData.length,
          items: incidentsData,
        },
        documents: {
          validCount: validDocs,
          expiringCount: expiringDocs,
          expiredCount: expiredDocs,
          items: documentItems,
        },
      };
    },
    enabled: Boolean(staffId),
    staleTime: 300000, // 5 minutes
  });
};
