import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StaffComplianceRow {
  staffId: string;
  staffName: string;
  trainingCompliancePercentage: number;
  documentStatus: 'compliant' | 'at-risk' | 'non-compliant';
  missedCallsCount: number;
  lateArrivalsCount: number;
  incidentsCount: number;
  overallScore: number;
  complianceLevel: 'compliant' | 'at-risk' | 'non-compliant';
}

export interface StaffComplianceMatrixData {
  staffRows: StaffComplianceRow[];
  summary: {
    totalStaff: number;
    compliantStaff: number;
    atRiskStaff: number;
    nonCompliantStaff: number;
    averageComplianceScore: number;
  };
  trends: {
    month: string;
    averageScore: number;
  }[];
}

interface UseStaffComplianceMatrixProps {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

const calculateDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const useStaffComplianceMatrix = ({
  branchId,
  startDate,
  endDate,
}: UseStaffComplianceMatrixProps) => {
  return useQuery({
    queryKey: ['staff-compliance-matrix', branchId, startDate, endDate],
    queryFn: async (): Promise<StaffComplianceMatrixData> => {
      console.log('[useStaffComplianceMatrix] Fetching data for branch:', branchId);

      // Fetch all staff members for the branch
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('id, first_name, last_name, branch_id')
        .eq('branch_id', branchId);

      if (staffError) throw staffError;

      if (!staffMembers || staffMembers.length === 0) {
        return {
          staffRows: [],
          summary: {
            totalStaff: 0,
            compliantStaff: 0,
            atRiskStaff: 0,
            nonCompliantStaff: 0,
            averageComplianceScore: 0,
          },
          trends: [],
        };
      }

      // Fetch compliance data for all staff in parallel
      const staffCompliancePromises = staffMembers.map(async (staff) => {
        const staffId = staff.id;
        const staffName = `${staff.first_name} ${staff.last_name}`;

        // Fetch training records
        const { data: trainingRecords } = await supabase
          .from('staff_training_records')
          .select(`
            status,
            expiry_date,
            training_course:training_courses!inner(is_mandatory)
          `)
          .eq('staff_id', staffId);

        // Fetch documents
        const { data: documents } = await supabase
          .from('staff_documents')
          .select('expiry_date, status')
          .eq('staff_id', staffId);

        // Fetch bookings (for missed calls)
        const { data: bookings } = await supabase
          .from('bookings')
          .select('status')
          .eq('staff_id', staffId)
          .eq('status', 'cancelled');

        // Fetch visit records (for incidents)
        const { data: visitRecords } = await supabase
          .from('visit_records')
          .select('visit_notes')
          .eq('staff_id', staffId)
          .not('visit_notes', 'is', null);

        // Calculate training compliance
        const mandatoryTraining = (trainingRecords || []).filter(
          (r) => r.training_course?.is_mandatory
        );
        const compliantTraining = (trainingRecords || []).filter((r) => {
          if (r.status !== 'completed') return false;
          if (!r.expiry_date) return true;
          const daysUntilExpiry = calculateDaysUntilExpiry(r.expiry_date);
          return daysUntilExpiry !== null && daysUntilExpiry > 0;
        });

        const trainingCompliancePercentage =
          mandatoryTraining.length > 0
            ? Math.round((compliantTraining.length / mandatoryTraining.length) * 100)
            : 100;

        // Calculate document status
        const expiredDocs = (documents || []).filter((d) => {
          if (d.status === 'expired') return true;
          if (!d.expiry_date) return false;
          const daysUntilExpiry = calculateDaysUntilExpiry(d.expiry_date);
          return daysUntilExpiry !== null && daysUntilExpiry < 0;
        }).length;

        const expiringDocs = (documents || []).filter((d) => {
          if (!d.expiry_date) return false;
          const daysUntilExpiry = calculateDaysUntilExpiry(d.expiry_date);
          return daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
        }).length;

        let documentStatus: 'compliant' | 'at-risk' | 'non-compliant' = 'compliant';
        if (expiredDocs > 0) {
          documentStatus = 'non-compliant';
        } else if (expiringDocs > 0) {
          documentStatus = 'at-risk';
        }

        // Count missed calls
        const missedCallsCount = (bookings || []).length;

        // Count late arrivals (placeholder - would need actual clock-in data)
        const lateArrivalsCount = 0;

        // Count incidents
        const incidentsCount = (visitRecords || []).filter(
          (r) =>
            r.visit_notes &&
            (r.visit_notes.toLowerCase().includes('incident') ||
              r.visit_notes.toLowerCase().includes('issue') ||
              r.visit_notes.toLowerCase().includes('concern'))
        ).length;

        // Calculate overall score
        const documentScore = documents && documents.length > 0
          ? ((documents.length - expiredDocs - expiringDocs * 0.5) / documents.length) * 100
          : 100;

        const incidentPenalty = Math.min(incidentsCount * 5, 20);
        const missedCallPenalty = Math.min(missedCallsCount * 5, 20);
        const lateArrivalPenalty = Math.min(lateArrivalsCount * 3, 20);

        const overallScore = Math.max(
          0,
          Math.round(
            trainingCompliancePercentage * 0.4 +
              documentScore * 0.3 -
              (incidentPenalty + missedCallPenalty + lateArrivalPenalty)
          )
        );

        // Determine compliance level
        let complianceLevel: 'compliant' | 'at-risk' | 'non-compliant' = 'compliant';
        if (overallScore < 70) {
          complianceLevel = 'non-compliant';
        } else if (overallScore < 85) {
          complianceLevel = 'at-risk';
        }

        return {
          staffId,
          staffName,
          trainingCompliancePercentage,
          documentStatus,
          missedCallsCount,
          lateArrivalsCount,
          incidentsCount,
          overallScore,
          complianceLevel,
        };
      });

      const staffRows = await Promise.all(staffCompliancePromises);

      // Calculate summary
      const totalStaff = staffRows.length;
      const compliantStaff = staffRows.filter((s) => s.complianceLevel === 'compliant').length;
      const atRiskStaff = staffRows.filter((s) => s.complianceLevel === 'at-risk').length;
      const nonCompliantStaff = staffRows.filter((s) => s.complianceLevel === 'non-compliant').length;
      const averageComplianceScore =
        totalStaff > 0
          ? Math.round(staffRows.reduce((sum, s) => sum + s.overallScore, 0) / totalStaff)
          : 0;

      // Generate trend data (simplified - last 6 months)
      const trends = [];
      const currentDate = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthName = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        // Simplified: use current average score (in real implementation, would query historical data)
        trends.push({
          month: monthName,
          averageScore: averageComplianceScore,
        });
      }

      console.log('[useStaffComplianceMatrix] Processed', totalStaff, 'staff members');

      return {
        staffRows,
        summary: {
          totalStaff,
          compliantStaff,
          atRiskStaff,
          nonCompliantStaff,
          averageComplianceScore,
        },
        trends,
      };
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
