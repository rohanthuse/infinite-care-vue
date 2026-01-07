
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClientAppointments, useCompletedAppointments } from '@/hooks/useClientAppointments';
import { useClientServiceActions } from '@/hooks/useClientServiceActions';

export interface ServiceReportData {
  serviceUtilization: Array<{
    date: string;
    duration: number;
    type: string;
    goals: number;
    completed: number;
  }>;
  progressData: Array<{
    month: string;
    progress: number;
  }>;
  serviceTypeData: Array<{
    name: string;
    value: number;
  }>;
}

export const useClientServiceReports = (
  clientId: string,
  timeFilter: string = "month",
  serviceFilter: string = "all"
) => {
  const { data: appointments } = useClientAppointments(clientId);
  const { data: serviceActions } = useClientServiceActions(clientId);
  const { data: completedAppointments } = useCompletedAppointments(clientId);

  return useQuery({
    queryKey: ['client-service-reports', clientId, timeFilter, serviceFilter],
    queryFn: async (): Promise<ServiceReportData> => {
      console.log('[ClientServiceReports] Generating reports for client:', clientId);
      
      // Calculate date range based on time filter
      const now = new Date();
      let startDate: Date;
      let timeUnit: 'day' | 'week' | 'month' = 'month';
      let periodCount = 5;
      
      switch (timeFilter) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          timeUnit = 'day';
          periodCount = 7;
          break;
        case 'quarter':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          timeUnit = 'month';
          periodCount = 3;
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          timeUnit = 'month';
          periodCount = 12;
          break;
        default: // month
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          timeUnit = 'day';
          periodCount = 30;
      }

      // Get care plan goals with their progress history
      // Include ALL care plans (not just active) to show historical data for inactive clients
      const { data: carePlans } = await supabase
        .from('client_care_plans')
        .select(`
          id,
          title,
          start_date,
          end_date,
          completion_percentage,
          status,
          client_care_plan_goals(
            id,
            description,
            status,
            progress,
            created_at,
            updated_at
          )
        `)
        .eq('client_id', clientId);
      // Removed: .eq('status', 'active') - to show all care plans including historical/completed

      // Filter appointments by date and service type
      const filteredAppointments = (appointments || []).filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        const matchesDate = aptDate >= startDate;
        const matchesService = serviceFilter === 'all' || 
          apt.appointment_type.toLowerCase() === serviceFilter.toLowerCase();
        return matchesDate && matchesService;
      });

      // Generate service utilization data
      const serviceUtilization = filteredAppointments.map(apt => {
        // Find related care plan goals
        const relatedGoals = carePlans?.flatMap(cp => cp.client_care_plan_goals || []) || [];
        const totalGoals = relatedGoals.length;
        const completedGoals = relatedGoals.filter(goal => 
          goal.status === 'completed' || goal.progress === 100
        ).length;

        return {
          date: apt.appointment_date,
          duration: 60, // Default duration, could be enhanced with actual data
          type: apt.appointment_type,
          goals: totalGoals,
          completed: completedGoals
        };
      });

      // Generate dynamic progress data based on actual goal progress
      const progressData = await generateProgressData(
        carePlans || [],
        timeUnit,
        periodCount,
        startDate,
        now
      );

      // Generate service type distribution
      const serviceTypeCounts: Record<string, number> = {};
      filteredAppointments.forEach(apt => {
        const type = apt.appointment_type || 'Other';
        serviceTypeCounts[type] = (serviceTypeCounts[type] || 0) + 1;
      });

      // Add service actions to the mix
      const filteredServiceActions = (serviceActions || []).filter(action => {
        const actionDate = new Date(action.start_date);
        const matchesDate = actionDate >= startDate;
        const matchesService = serviceFilter === 'all' || 
          action.service_category.toLowerCase() === serviceFilter.toLowerCase();
        return matchesDate && matchesService;
      });

      filteredServiceActions.forEach(action => {
        const type = action.service_category || 'Other';
        serviceTypeCounts[type] = (serviceTypeCounts[type] || 0) + 1;
      });

      const serviceTypeData = Object.entries(serviceTypeCounts).map(([name, value]) => ({
        name,
        value
      }));

      console.log('[ClientServiceReports] Generated report data:', {
        serviceUtilization: serviceUtilization.length,
        progressData: progressData.length,
        serviceTypeData: serviceTypeData.length
      });

      return {
        serviceUtilization,
        progressData,
        serviceTypeData
      };
    },
    enabled: Boolean(clientId),
    refetchInterval: 300000, // Refetch every 5 minutes
  });
};

// Helper function to generate dynamic progress data based on actual goal completion
async function generateProgressData(
  carePlans: any[],
  timeUnit: 'day' | 'week' | 'month',
  periodCount: number,
  startDate: Date,
  endDate: Date
): Promise<Array<{ month: string; progress: number }>> {
  const progressData: Array<{ month: string; progress: number }> = [];
  
  // Create time periods based on the time unit
  for (let i = periodCount - 1; i >= 0; i--) {
    let periodStart: Date;
    let periodEnd: Date;
    let labelFormat: string;
    
    if (timeUnit === 'day') {
      periodStart = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
      labelFormat = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (timeUnit === 'week') {
      periodStart = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      periodEnd = new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      labelFormat = `Week ${Math.ceil((endDate.getTime() - periodStart.getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
    } else { // month
      periodStart = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      periodEnd = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 1);
      labelFormat = periodStart.toLocaleDateString('en-US', { month: 'short' });
    }

    // Calculate actual progress for this period
    let periodProgress = 0;
    let totalGoals = 0;
    let completedProgress = 0;

    carePlans.forEach(carePlan => {
      const goals = carePlan.client_care_plan_goals || [];
      
      goals.forEach((goal: any) => {
        // Check if goal was active/updated during this period
        const goalUpdated = new Date(goal.updated_at);
        const goalCreated = new Date(goal.created_at);
        
        // Include goal if it was created before or during this period and updated during or before
        if (goalCreated <= periodEnd && goalUpdated >= periodStart) {
          totalGoals++;
          completedProgress += goal.progress || 0;
        }
      });
    });

    // Calculate average progress for the period
    if (totalGoals > 0) {
      periodProgress = Math.round(completedProgress / totalGoals);
    } else {
      // If no goals data, try to use care plan completion percentage
      const activeCarePlans = carePlans.filter(cp => {
        const startDate = new Date(cp.start_date);
        return startDate <= periodEnd;
      });
      
      if (activeCarePlans.length > 0) {
        const avgCompletion = activeCarePlans.reduce((sum, cp) => sum + (cp.completion_percentage || 0), 0) / activeCarePlans.length;
        periodProgress = Math.round(avgCompletion);
      } else {
        // No data available - show 0 progress rather than simulated data
        periodProgress = 0;
      }
    }

    progressData.push({
      month: labelFormat,
      progress: Math.max(0, Math.min(100, periodProgress))
    });
  }

  return progressData;
}
