
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "./useCarerAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

export interface ActivityMetrics {
  totalActivities: number;
  completedActivities: number;
  completionRate: number;
  totalIncidents: number;
  serviceActions: number;
  averageActivitiesPerWeek: number;
}

export interface ActivityTrend {
  date: string;
  activities: number;
  completed: number;
  incidents: number;
}

export interface ServiceDelivery {
  category: string;
  count: number;
  percentage: number;
}

export interface IncidentReport {
  severity: string;
  count: number;
  month: string;
}

export interface ActivityReportsData {
  metrics: ActivityMetrics;
  weeklyTrends: ActivityTrend[];
  serviceDelivery: ServiceDelivery[];
  incidentReports: IncidentReport[];
}

export const useCarerActivityReports = (dateRange?: { from: Date; to: Date }) => {
  const { carerProfile } = useCarerAuth();
  
  return useQuery({
    queryKey: ['carer-activity-reports', carerProfile?.id, dateRange],
    queryFn: async (): Promise<ActivityReportsData> => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      console.log('Fetching activity data for carer:', carerProfile.id, 'Date range:', startDate, 'to', endDate);

      // Get bookings for the carer (appointments/visits)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          ),
          services (
            id,
            title
          )
        `)
        .eq('staff_id', carerProfile.id)
        .gte('start_time', startDate)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
        throw bookingsError;
      }

      // Get client activities from care plans for clients assigned to this carer
      const { data: activities, error: activitiesError } = await supabase
        .from('client_activities')
        .select(`
          *,
          client_care_plans!inner (
            client_id,
            staff_id,
            clients (
              id,
              first_name,
              last_name
            )
          )
        `)
        .eq('client_care_plans.staff_id', carerProfile.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        // Don't throw, just log and continue with empty array
      }

      // Get service actions
      const { data: serviceActions, error: serviceActionsError } = await supabase
        .from('client_service_actions')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (serviceActionsError) {
        console.error('Error fetching service actions:', serviceActionsError);
      }

      // Get incidents/events for clients in the branch
      const { data: incidents, error: incidentsError } = await supabase
        .from('client_events_logs')
        .select('*')
        .eq('branch_id', carerProfile.branch_id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (incidentsError) {
        console.error('Error fetching incidents:', incidentsError);
      }

      // Process the data
      const processedData = processActivityData(
        bookings || [],
        activities || [],
        serviceActions || [],
        incidents || []
      );
      
      return processedData;
    },
    enabled: !!carerProfile?.id,
    retry: 2,
  });
};

function processActivityData(
  bookings: any[],
  activities: any[],
  serviceActions: any[],
  incidents: any[]
): ActivityReportsData {
  console.log('Processing activity data:', {
    bookings: bookings.length,
    activities: activities.length,
    serviceActions: serviceActions.length,
    incidents: incidents.length
  });

  // Calculate metrics
  const totalActivities = activities.length + bookings.length;
  const completedActivities = activities.filter(a => a.status === 'completed').length + 
                            bookings.filter(b => b.status === 'completed').length;
  const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
  const totalIncidents = incidents.length;
  const serviceActionsCount = serviceActions.length;
  const averageActivitiesPerWeek = totalActivities / 4; // Assuming 4 weeks in the period

  const metrics: ActivityMetrics = {
    totalActivities,
    completedActivities,
    completionRate,
    totalIncidents,
    serviceActions: serviceActionsCount,
    averageActivitiesPerWeek,
  };

  // Process weekly trends (group by week)
  const weeklyData = new Map<string, { activities: number; completed: number; incidents: number }>();
  
  // Process bookings for trends
  bookings.forEach(booking => {
    const weekStart = format(startOfWeek(parseISO(booking.start_time)), 'yyyy-MM-dd');
    const current = weeklyData.get(weekStart) || { activities: 0, completed: 0, incidents: 0 };
    
    weeklyData.set(weekStart, {
      ...current,
      activities: current.activities + 1,
      completed: current.completed + (booking.status === 'completed' ? 1 : 0)
    });
  });

  // Process activities for trends
  activities.forEach(activity => {
    const weekStart = format(startOfWeek(parseISO(activity.created_at)), 'yyyy-MM-dd');
    const current = weeklyData.get(weekStart) || { activities: 0, completed: 0, incidents: 0 };
    
    weeklyData.set(weekStart, {
      ...current,
      activities: current.activities + 1,
      completed: current.completed + (activity.status === 'completed' ? 1 : 0)
    });
  });

  // Process incidents for trends
  incidents.forEach(incident => {
    const weekStart = format(startOfWeek(parseISO(incident.created_at)), 'yyyy-MM-dd');
    const current = weeklyData.get(weekStart) || { activities: 0, completed: 0, incidents: 0 };
    
    weeklyData.set(weekStart, {
      ...current,
      incidents: current.incidents + 1
    });
  });

  const weeklyTrends: ActivityTrend[] = Array.from(weeklyData.entries()).map(([date, data]) => ({
    date,
    activities: data.activities,
    completed: data.completed,
    incidents: data.incidents,
  }));

  // Process service delivery by category
  const serviceCategories = new Map<string, number>();
  serviceActions.forEach(action => {
    const category = action.service_category || 'Other';
    serviceCategories.set(category, (serviceCategories.get(category) || 0) + 1);
  });

  const totalServices = Array.from(serviceCategories.values()).reduce((sum, count) => sum + count, 0);
  const serviceDelivery: ServiceDelivery[] = Array.from(serviceCategories.entries()).map(([category, count]) => ({
    category,
    count,
    percentage: totalServices > 0 ? Math.round((count / totalServices) * 100) : 0,
  }));

  // Process incident reports by severity and month
  const incidentsByMonth = new Map<string, Map<string, number>>();
  incidents.forEach(incident => {
    const month = format(parseISO(incident.created_at), 'MMM yyyy');
    const severity = incident.severity || 'low';
    
    if (!incidentsByMonth.has(month)) {
      incidentsByMonth.set(month, new Map());
    }
    
    const monthData = incidentsByMonth.get(month)!;
    monthData.set(severity, (monthData.get(severity) || 0) + 1);
  });

  const incidentReports: IncidentReport[] = [];
  incidentsByMonth.forEach((severityMap, month) => {
    severityMap.forEach((count, severity) => {
      incidentReports.push({ month, severity, count });
    });
  });

  console.log('Processed activity metrics:', metrics);

  return {
    metrics,
    weeklyTrends,
    serviceDelivery,
    incidentReports,
  };
}
