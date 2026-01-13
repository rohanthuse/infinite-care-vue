import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MissedCallDetail {
  id: string;
  staffId: string;
  staffName: string;
  clientId: string;
  clientName: string;
  scheduledDate: string;
  scheduledTime: string;
  reason: string;
  status: string;
}

export interface MissedCallByStaff {
  staffId: string;
  staffName: string;
  missedCallsCount: number;
  reliabilityRate: number;
}

export interface MissedCallByReason {
  reason: string;
  count: number;
}

export interface MissedCallTrend {
  month: string;
  missedCalls: number;
  totalBookings: number;
  missRate: number;
}

export interface ReasonTrend {
  month: string;
  [reason: string]: number | string;
}

export interface MissedCallsData {
  summary: {
    totalMissedCalls: number;
    totalBookings: number;
    missRate: number;
    topStaffWithMissedCalls: string;
    mostCommonReason: string;
  };
  byStaff: MissedCallByStaff[];
  byReason: MissedCallByReason[];
  trends: MissedCallTrend[];
  reasonTrends: ReasonTrend[];
  recentMissedCalls: MissedCallDetail[];
}

interface UseMissedCallsDataProps {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

export const useMissedCallsData = ({
  branchId,
  startDate,
  endDate,
}: UseMissedCallsDataProps) => {
  return useQuery({
    queryKey: ['missed-calls', branchId, startDate, endDate],
    queryFn: async (): Promise<MissedCallsData> => {
      console.log('[useMissedCallsData] Fetching data for branch:', branchId);

      // Fetch all bookings with date filter
      let allBookingsQuery = supabase
        .from('bookings')
        .select(`
          id,
          branch_id,
          start_time,
          end_time,
          status,
          notes,
          cancellation_reason,
        staff(id, first_name, last_name),
        client:clients(id, first_name, last_name)
        `)
        .eq('branch_id', branchId);

      if (startDate) {
        allBookingsQuery = allBookingsQuery.gte('start_time', startDate);
      }
      if (endDate) {
        allBookingsQuery = allBookingsQuery.lte('start_time', endDate);
      }

      const { data: allBookings, error: allBookingsError } = await allBookingsQuery;

      if (allBookingsError) {
        console.error('[useMissedCallsData] Error fetching all bookings:', allBookingsError);
        throw allBookingsError;
      }

      // Fetch missed calls (cancelled and no-show bookings)
      let missedQuery = supabase
        .from('bookings')
        .select(`
          id,
          branch_id,
          start_time,
          end_time,
          status,
          notes,
          cancellation_reason,
        staff(id, first_name, last_name),
        client:clients(id, first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .in('status', ['cancelled', 'no-show']);

      if (startDate) {
        missedQuery = missedQuery.gte('start_time', startDate);
      }
      if (endDate) {
        missedQuery = missedQuery.lte('start_time', endDate);
      }

      const { data: missedCalls, error: missedError } = await missedQuery.order('start_time', { ascending: false });

      if (missedError) {
        console.error('[useMissedCallsData] Error:', missedError);
        throw missedError;
      }

      if (!missedCalls || missedCalls.length === 0) {
        return {
          summary: {
            totalMissedCalls: 0,
            totalBookings: allBookings?.length || 0,
            missRate: 0,
            topStaffWithMissedCalls: 'N/A',
            mostCommonReason: 'N/A',
          },
          byStaff: [],
          byReason: [],
          trends: [],
          reasonTrends: [],
          recentMissedCalls: [],
        };
      }

      const totalMissedCalls = missedCalls.length;
      const totalBookings = allBookings?.length || 0;
      const missRate = totalBookings > 0 ? Math.round((totalMissedCalls / totalBookings) * 100) : 0;

      // Group by staff
      const staffMap = new Map<string, { name: string; missed: number; total: number }>();
      
      // Count all bookings by staff
      (allBookings || []).forEach((booking) => {
        if (booking.staff) {
          const staffId = booking.staff.id;
          const staffName = `${booking.staff.first_name} ${booking.staff.last_name}`;
          const current = staffMap.get(staffId) || { name: staffName, missed: 0, total: 0 };
          current.total += 1;
          staffMap.set(staffId, current);
        }
      });

      // Count missed calls by staff
      missedCalls.forEach((call) => {
        if (call.staff) {
          const staffId = call.staff.id;
          const current = staffMap.get(staffId);
          if (current) {
            current.missed += 1;
            staffMap.set(staffId, current);
          }
        }
      });

      const byStaff: MissedCallByStaff[] = Array.from(staffMap.entries())
        .map(([staffId, data]) => ({
          staffId,
          staffName: data.name,
          missedCallsCount: data.missed,
          reliabilityRate: data.total > 0 ? Math.round(((data.total - data.missed) / data.total) * 100) : 100,
        }))
        .filter((s) => s.missedCallsCount > 0)
        .sort((a, b) => b.missedCallsCount - a.missedCallsCount);

      // Top staff with missed calls
      const topStaffWithMissedCalls =
        byStaff.length > 0 ? `${byStaff[0].staffName} (${byStaff[0].missedCallsCount})` : 'N/A';

      // Group by reason (prioritize cancellation_reason field)
      const reasonMap = new Map<string, number>();
      missedCalls.forEach((call) => {
        const reason = call.cancellation_reason 
          ? call.cancellation_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : (call.notes || 'No reason provided');
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

      const byReason: MissedCallByReason[] = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const mostCommonReason = byReason.length > 0 ? byReason[0].reason : 'N/A';

      // Generate trend data (last 6 months)
      const monthMap = new Map<string, { missed: number; total: number }>();

      (allBookings || []).forEach((booking) => {
        const date = new Date(booking.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey) || { missed: 0, total: 0 };
        current.total += 1;
        monthMap.set(monthKey, current);
      });

      missedCalls.forEach((call) => {
        const date = new Date(call.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey);
        if (current) {
          current.missed += 1;
        }
      });

      const trends: MissedCallTrend[] = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          missedCalls: data.missed,
          totalBookings: data.total,
          missRate: data.total > 0 ? Math.round((data.missed / data.total) * 100) : 0,
        }))
        .reverse()
        .slice(0, 6)
        .reverse();

      // Generate reason trends (missed calls by reason over time)
      const reasonByMonthMap = new Map<string, Map<string, number>>();
      
      missedCalls.forEach((call) => {
        const date = new Date(call.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const reason = call.cancellation_reason 
          ? call.cancellation_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : (call.notes || 'No reason provided');
        
        if (!reasonByMonthMap.has(monthKey)) {
          reasonByMonthMap.set(monthKey, new Map());
        }
        const monthReasons = reasonByMonthMap.get(monthKey)!;
        monthReasons.set(reason, (monthReasons.get(reason) || 0) + 1);
      });

      // Get all unique reasons for consistent chart structure
      const allReasons = new Set<string>();
      byReason.slice(0, 5).forEach(r => allReasons.add(r.reason));

      const reasonTrends: ReasonTrend[] = Array.from(monthMap.keys())
        .reverse()
        .slice(0, 6)
        .reverse()
        .map((month) => {
          const trend: ReasonTrend = { month };
          const monthReasons = reasonByMonthMap.get(month) || new Map();
          
          allReasons.forEach((reason) => {
            trend[reason] = monthReasons.get(reason) || 0;
          });
          
          return trend;
        });

      // Recent missed calls
      const recentMissedCalls: MissedCallDetail[] = missedCalls.slice(0, 20).map((call) => {
        const scheduledDate = new Date(call.start_time);
        return {
          id: call.id,
          staffId: call.staff?.id || '',
          staffName: call.staff ? `${call.staff.first_name} ${call.staff.last_name}` : 'Unknown',
          clientId: call.client?.id || '',
          clientName: call.client ? `${call.client.first_name} ${call.client.last_name}` : 'Unknown',
          scheduledDate: scheduledDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          scheduledTime: scheduledDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          reason: call.cancellation_reason
            ? call.cancellation_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : (call.notes || 'No reason provided'),
          status: call.status || 'cancelled',
        };
      });

      console.log('[useMissedCallsData] Processed', totalMissedCalls, 'missed calls');

      return {
        summary: {
          totalMissedCalls,
          totalBookings,
          missRate,
          topStaffWithMissedCalls,
          mostCommonReason,
        },
        byStaff,
        byReason,
        trends,
        reasonTrends,
        recentMissedCalls,
      };
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
