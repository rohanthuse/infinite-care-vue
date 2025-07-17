import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrainingMetricsSummary {
  totalStaff: number;
  totalTrainingRecords: number;
  overallComplianceRate: number;
  overdueTrainings: number;
  expiringTrainings: number;
  completedThisMonth: number;
}

export interface StaffTrainingMetrics {
  staffId: string;
  staffName: string;
  specialization: string | null;
  totalAssigned: number;
  completed: number;
  inProgress: number;
  overdue: number;
  expiring: number;
  complianceRate: number;
  overdueTrainings: Array<{
    trainingTitle: string;
    dueDate: string;
    daysPastDue: number;
  }>;
  expiringTrainings: Array<{
    trainingTitle: string;
    expiryDate: string;
    daysUntilExpiry: number;
  }>;
}

export interface TrainingCategoryMetrics {
  category: string;
  totalRecords: number;
  completed: number;
  inProgress: number;
  overdue: number;
  complianceRate: number;
}

export interface BranchTrainingMetrics {
  summary: TrainingMetricsSummary;
  staffMetrics: StaffTrainingMetrics[];
  categoryMetrics: TrainingCategoryMetrics[];
  recentActivity: Array<{
    date: string;
    staffName: string;
    trainingTitle: string;
    action: 'completed' | 'assigned' | 'expired';
  }>;
}

export const useBranchTrainingMetrics = (branchId: string, dateRange?: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['branch-training-metrics', branchId, dateRange],
    queryFn: async (): Promise<BranchTrainingMetrics> => {
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all training records for the branch
      const { data: records, error } = await supabase
        .from('staff_training_records')
        .select(`
          *,
          staff:staff!inner(id, first_name, last_name, specialization),
          training_course:training_courses!inner(id, title, category, max_score)
        `)
        .eq('branch_id', branchId)
        .eq('staff.status', 'active');

      if (error) throw error;

      const trainingRecords = records || [];

      // Calculate summary metrics
      const uniqueStaff = new Set(trainingRecords.map(r => r.staff_id));
      const totalStaff = uniqueStaff.size;
      const totalTrainingRecords = trainingRecords.length;

      const completedRecords = trainingRecords.filter(r => r.status === 'completed');
      const overallComplianceRate = totalTrainingRecords > 0 
        ? Math.round((completedRecords.length / totalTrainingRecords) * 100)
        : 0;

      const overdueRecords = trainingRecords.filter(r => {
        if (r.status === 'completed') return false;
        if (!r.expiry_date) return false;
        return new Date(r.expiry_date) < now;
      });

      const expiringRecords = trainingRecords.filter(r => {
        if (r.status !== 'completed') return false;
        if (!r.expiry_date) return false;
        const expiryDate = new Date(r.expiry_date);
        return expiryDate > now && expiryDate <= thirtyDaysFromNow;
      });

      const completedThisMonth = trainingRecords.filter(r => {
        if (!r.completion_date) return false;
        const completionDate = new Date(r.completion_date);
        return completionDate >= monthStart;
      }).length;

      const summary: TrainingMetricsSummary = {
        totalStaff,
        totalTrainingRecords,
        overallComplianceRate,
        overdueTrainings: overdueRecords.length,
        expiringTrainings: expiringRecords.length,
        completedThisMonth,
      };

      // Calculate staff metrics
      const staffMetrics: StaffTrainingMetrics[] = Array.from(uniqueStaff).map(staffId => {
        const staffRecords = trainingRecords.filter(r => r.staff_id === staffId);
        const staffData = staffRecords[0]?.staff;
        
        const completed = staffRecords.filter(r => r.status === 'completed').length;
        const inProgress = staffRecords.filter(r => r.status === 'in-progress').length;
        
        const staffOverdue = staffRecords.filter(r => {
          if (r.status === 'completed') return false;
          if (!r.expiry_date) return false;
          return new Date(r.expiry_date) < now;
        });

        const staffExpiring = staffRecords.filter(r => {
          if (r.status !== 'completed') return false;
          if (!r.expiry_date) return false;
          const expiryDate = new Date(r.expiry_date);
          return expiryDate > now && expiryDate <= thirtyDaysFromNow;
        });

        const complianceRate = staffRecords.length > 0 
          ? Math.round((completed / staffRecords.length) * 100)
          : 0;

        return {
          staffId,
          staffName: `${staffData?.first_name || ''} ${staffData?.last_name || ''}`.trim(),
          specialization: staffData?.specialization || null,
          totalAssigned: staffRecords.length,
          completed,
          inProgress,
          overdue: staffOverdue.length,
          expiring: staffExpiring.length,
          complianceRate,
          overdueTrainings: staffOverdue.map(r => ({
            trainingTitle: r.training_course?.title || 'Unknown Training',
            dueDate: r.expiry_date || '',
            daysPastDue: r.expiry_date ? Math.floor((now.getTime() - new Date(r.expiry_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
          })),
          expiringTrainings: staffExpiring.map(r => ({
            trainingTitle: r.training_course?.title || 'Unknown Training',
            expiryDate: r.expiry_date || '',
            daysUntilExpiry: r.expiry_date ? Math.floor((new Date(r.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
          })),
        };
      });

      // Calculate category metrics
      const categories = new Set(trainingRecords.map(r => r.training_course?.category).filter(Boolean));
      const categoryMetrics: TrainingCategoryMetrics[] = Array.from(categories).map(category => {
        const categoryRecords = trainingRecords.filter(r => r.training_course?.category === category);
        const completed = categoryRecords.filter(r => r.status === 'completed').length;
        const inProgress = categoryRecords.filter(r => r.status === 'in-progress').length;
        const overdue = categoryRecords.filter(r => {
          if (r.status === 'completed') return false;
          if (!r.expiry_date) return false;
          return new Date(r.expiry_date) < now;
        }).length;

        return {
          category: category || 'Uncategorized',
          totalRecords: categoryRecords.length,
          completed,
          inProgress,
          overdue,
          complianceRate: categoryRecords.length > 0 
            ? Math.round((completed / categoryRecords.length) * 100)
            : 0,
        };
      });

      // Get recent activity
      const recentActivity = trainingRecords
        .filter(r => r.completion_date && new Date(r.completion_date) >= monthStart)
        .map(r => ({
          date: r.completion_date!,
          staffName: `${r.staff?.first_name || ''} ${r.staff?.last_name || ''}`.trim(),
          trainingTitle: r.training_course?.title || 'Unknown Training',
          action: 'completed' as const,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);

      return {
        summary,
        staffMetrics: staffMetrics.sort((a, b) => a.staffName.localeCompare(b.staffName)),
        categoryMetrics: categoryMetrics.sort((a, b) => b.complianceRate - a.complianceRate),
        recentActivity,
      };
    },
    enabled: !!branchId,
  });
};