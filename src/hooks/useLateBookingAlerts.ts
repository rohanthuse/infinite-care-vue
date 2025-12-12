import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LateBookingAlert {
  id: string;
  start_time: string;
  end_time: string;
  is_late_start: boolean;
  is_missed: boolean;
  late_start_notified_at: string | null;
  missed_notified_at: string | null;
  late_start_minutes: number;
  status: string;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
  } | null;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
  service: {
    id: string;
    title: string;
  } | null;
  branch: {
    id: string;
    name: string;
  } | null;
}

export const useLateBookingAlerts = (branchId?: string) => {
  const queryClient = useQueryClient();

  const { data: lateStartAlerts, isLoading: isLoadingLateStart } = useQuery({
    queryKey: ['late-start-alerts', branchId],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          is_late_start,
          is_missed,
          late_start_notified_at,
          missed_notified_at,
          late_start_minutes,
          status,
          client:client_id (
            id,
            first_name,
            last_name,
            address
          ),
          staff:staff_id (
            id,
            first_name,
            last_name
          ),
          service:service_id (
            id,
            title
          ),
          branch:branch_id (
            id,
            name
          )
        `)
        .eq('is_late_start', true)
        .order('late_start_notified_at', { ascending: false })
        .limit(50);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useLateBookingAlerts] Error fetching late start alerts:', error);
        throw error;
      }

      return (data || []) as unknown as LateBookingAlert[];
    },
    refetchInterval: 30000,
  });

  const { data: missedBookings, isLoading: isLoadingMissed } = useQuery({
    queryKey: ['missed-bookings', branchId],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          is_late_start,
          is_missed,
          late_start_notified_at,
          missed_notified_at,
          late_start_minutes,
          status,
          client:client_id (
            id,
            first_name,
            last_name,
            address
          ),
          staff:staff_id (
            id,
            first_name,
            last_name
          ),
          service:service_id (
            id,
            title
          ),
          branch:branch_id (
            id,
            name
          )
        `)
        .eq('is_missed', true)
        .order('missed_notified_at', { ascending: false })
        .limit(50);

      if (branchId) {
        query = query.eq('branch_id', branchId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[useLateBookingAlerts] Error fetching missed bookings:', error);
        throw error;
      }

      return (data || []) as unknown as LateBookingAlert[];
    },
    refetchInterval: 30000,
  });

  const { data: todayStats } = useQuery({
    queryKey: ['late-booking-stats-today', branchId],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let lateQuery = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('is_late_start', true)
        .gte('late_start_notified_at', today.toISOString());

      let missedQuery = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('is_missed', true)
        .gte('missed_notified_at', today.toISOString());

      if (branchId) {
        lateQuery = lateQuery.eq('branch_id', branchId);
        missedQuery = missedQuery.eq('branch_id', branchId);
      }

      const [lateResult, missedResult] = await Promise.all([lateQuery, missedQuery]);

      return {
        lateStartCount: lateResult.count || 0,
        missedCount: missedResult.count || 0,
      };
    },
    refetchInterval: 60000,
  });

  const refreshAlerts = () => {
    queryClient.invalidateQueries({ queryKey: ['late-start-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['missed-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['late-booking-stats-today'] });
  };

  return {
    lateStartAlerts: lateStartAlerts || [],
    missedBookings: missedBookings || [],
    todayStats: todayStats || { lateStartCount: 0, missedCount: 0 },
    isLoading: isLoadingLateStart || isLoadingMissed,
    refreshAlerts,
  };
};

export const useTriggerAlertProcessing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('process-late-booking-alerts');
      
      if (error) {
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['late-start-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['missed-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['late-booking-stats-today'] });
    },
  });
};
