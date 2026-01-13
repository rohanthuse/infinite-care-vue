import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LateArrivalDetail {
  id: string;
  staffId: string;
  staffName: string;
  clientId: string;
  clientName: string;
  scheduledTime: string;
  actualArrivalTime: string;
  minutesLate: number;
  date: string;
  reason?: string;
}

export interface LateArrivalByStaff {
  staffId: string;
  staffName: string;
  lateArrivalsCount: number;
  averageMinutesLate: number;
  punctualityRate: number;
}

export interface LateArrivalTrend {
  month: string;
  lateArrivals: number;
  totalVisits: number;
  lateRate: number;
}

export interface LateArrivalByReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface LateArrivalReasonTrend {
  month: string;
  [reason: string]: number | string;
}

export interface LateArrivalsData {
  summary: {
    totalLateArrivals: number;
    totalVisits: number;
    lateRate: number;
    averageMinutesLate: number;
    topStaffWithLateArrivals: string;
  };
  byStaff: LateArrivalByStaff[];
  byReason: LateArrivalByReason[];
  trends: LateArrivalTrend[];
  reasonTrends: LateArrivalReasonTrend[];
  recentLateArrivals: LateArrivalDetail[];
}

interface UseLateArrivalsDataProps {
  branchId: string;
  startDate?: string;
  endDate?: string;
}

export const useLateArrivalsData = ({
  branchId,
  startDate,
  endDate,
}: UseLateArrivalsDataProps) => {
  return useQuery({
    queryKey: ['late-arrivals', branchId, startDate, endDate],
    queryFn: async (): Promise<LateArrivalsData> => {
      console.log('[useLateArrivalsData] Fetching data for branch:', branchId);

      // Fetch visit records with proper PostgREST joins
      let query = supabase
        .from('visit_records')
        .select(`
          id,
          branch_id,
          visit_start_time,
          created_at,
          late_arrival_reason,
          arrival_delay_minutes,
        booking:bookings(start_time),
        staff(id, first_name, last_name),
        client:clients(id, first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .not('visit_start_time', 'is', null);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: visits, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('[useLateArrivalsData] Error fetching visits:', error);
        throw error;
      }

      if (!visits || visits.length === 0) {
        return {
          summary: {
            totalLateArrivals: 0,
            totalVisits: 0,
            lateRate: 0,
            averageMinutesLate: 0,
            topStaffWithLateArrivals: 'N/A',
          },
          byStaff: [],
          byReason: [],
          trends: [],
          reasonTrends: [],
          recentLateArrivals: [],
        };
      }

      const visitsWithBookings = visits;

      // Sort by booking start time (most recent first)
      visitsWithBookings.sort((a, b) => {
        if (!a.booking?.start_time || !b.booking?.start_time) return 0;
        return new Date(b.booking.start_time).getTime() - new Date(a.booking.start_time).getTime();
      });

      // Calculate late arrivals (more than 15 minutes late)
      const lateThresholdMinutes = 15;
      const lateArrivals = visitsWithBookings.filter((visit) => {
        if (!visit.booking?.start_time || !visit.visit_start_time) return false;
        
        const scheduled = new Date(visit.booking.start_time);
        const actual = new Date(visit.visit_start_time);
        const diffMinutes = Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));
        
        return diffMinutes > lateThresholdMinutes;
      });

      const totalLateArrivals = lateArrivals.length;
      const totalVisits = visitsWithBookings.length;
      const lateRate = totalVisits > 0 ? Math.round((totalLateArrivals / totalVisits) * 100) : 0;

      // Calculate average minutes late
      const totalMinutesLate = lateArrivals.reduce((sum, visit) => {
        const scheduled = new Date(visit.booking.start_time);
        const actual = new Date(visit.visit_start_time!);
        const diffMinutes = Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));
        return sum + diffMinutes;
      }, 0);
      const averageMinutesLate =
        lateArrivals.length > 0 ? Math.round(totalMinutesLate / lateArrivals.length) : 0;

      // Group by staff
      const staffMap = new Map<string, { name: string; late: number; total: number; totalMinutesLate: number }>();

      // Count all visits by staff
      visitsWithBookings.forEach((visit) => {
        if (visit.staff && Array.isArray(visit.staff) && visit.staff.length > 0) {
          const staffId = visit.staff[0].id;
          const staffName = `${visit.staff[0].first_name} ${visit.staff[0].last_name}`;
          const current = staffMap.get(staffId) || { name: staffName, late: 0, total: 0, totalMinutesLate: 0 };
          current.total += 1;
          staffMap.set(staffId, current);
        }
      });

      // Count late arrivals by staff
      lateArrivals.forEach((visit) => {
        if (visit.staff && Array.isArray(visit.staff) && visit.staff.length > 0) {
          const staffId = visit.staff[0].id;
          const current = staffMap.get(staffId);
          if (current) {
            current.late += 1;
            
            const scheduled = new Date(visit.booking.start_time);
            const actual = new Date(visit.visit_start_time!);
            const diffMinutes = Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));
            current.totalMinutesLate += diffMinutes;
            
            staffMap.set(staffId, current);
          }
        }
      });

      const byStaff: LateArrivalByStaff[] = Array.from(staffMap.entries())
        .map(([staffId, data]) => ({
          staffId,
          staffName: data.name,
          lateArrivalsCount: data.late,
          averageMinutesLate: data.late > 0 ? Math.round(data.totalMinutesLate / data.late) : 0,
          punctualityRate: data.total > 0 ? Math.round(((data.total - data.late) / data.total) * 100) : 100,
        }))
        .filter((s) => s.lateArrivalsCount > 0)
        .sort((a, b) => b.lateArrivalsCount - a.lateArrivalsCount);

      // Top staff with late arrivals
      const topStaffWithLateArrivals =
        byStaff.length > 0 ? `${byStaff[0].staffName} (${byStaff[0].lateArrivalsCount})` : 'N/A';

      // Generate trend data (last 6 months)
      const monthMap = new Map<string, { late: number; total: number }>();

      visitsWithBookings.forEach((visit) => {
        if (!visit.booking?.start_time) return;
        const date = new Date(visit.booking.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey) || { late: 0, total: 0 };
        current.total += 1;
        monthMap.set(monthKey, current);
      });

      lateArrivals.forEach((visit) => {
        if (!visit.booking?.start_time) return;
        const date = new Date(visit.booking.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const current = monthMap.get(monthKey);
        if (current) {
          current.late += 1;
        }
      });

      const trends: LateArrivalTrend[] = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          lateArrivals: data.late,
          totalVisits: data.total,
          lateRate: data.total > 0 ? Math.round((data.late / data.total) * 100) : 0,
        }))
        .reverse()
        .slice(0, 6)
        .reverse();

      // Group by reason
      const reasonMap = new Map<string, number>();
      lateArrivals.forEach((visit) => {
        const reason = visit.late_arrival_reason 
          ? visit.late_arrival_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : 'No reason provided';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
      });

      const byReason: LateArrivalByReason[] = Array.from(reasonMap.entries())
        .map(([reason, count]) => ({ 
          reason, 
          count,
          percentage: totalLateArrivals > 0 ? Math.round((count / totalLateArrivals) * 100) : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Generate reason trends (late arrivals by reason over time)
      const reasonByMonthMap = new Map<string, Map<string, number>>();
      
      lateArrivals.forEach((visit) => {
        if (!visit.booking?.start_time) return;
        const date = new Date(visit.booking.start_time);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const reason = visit.late_arrival_reason 
          ? visit.late_arrival_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
          : 'No reason provided';
        
        if (!reasonByMonthMap.has(monthKey)) {
          reasonByMonthMap.set(monthKey, new Map());
        }
        const monthReasons = reasonByMonthMap.get(monthKey)!;
        monthReasons.set(reason, (monthReasons.get(reason) || 0) + 1);
      });

      // Get all unique reasons for consistent chart structure
      const allReasons = new Set<string>();
      byReason.slice(0, 5).forEach(r => allReasons.add(r.reason));

      const reasonTrends: LateArrivalReasonTrend[] = Array.from(monthMap.keys())
        .reverse()
        .slice(0, 6)
        .reverse()
        .map((month) => {
          const trend: LateArrivalReasonTrend = { month };
          const monthReasons = reasonByMonthMap.get(month) || new Map();
          
          allReasons.forEach((reason) => {
            trend[reason] = monthReasons.get(reason) || 0;
          });
          
          return trend;
        });

      // Recent late arrivals
      const recentLateArrivals: LateArrivalDetail[] = lateArrivals.slice(0, 20).map((visit) => {
        const scheduled = new Date(visit.booking.start_time);
        const actual = new Date(visit.visit_start_time!);
        const minutesLate = visit.arrival_delay_minutes || Math.floor((actual.getTime() - scheduled.getTime()) / (1000 * 60));

        const staffData = Array.isArray(visit.staff) && visit.staff.length > 0 ? visit.staff[0] : null;
        const clientData = Array.isArray(visit.client) && visit.client.length > 0 ? visit.client[0] : null;

        return {
          id: visit.id,
          staffId: staffData?.id || '',
          staffName: staffData ? `${staffData.first_name} ${staffData.last_name}` : 'Unknown',
          clientId: clientData?.id || '',
          clientName: clientData ? `${clientData.first_name} ${clientData.last_name}` : 'Unknown',
          scheduledTime: scheduled.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          actualArrivalTime: actual.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          minutesLate,
          date: scheduled.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          reason: visit.late_arrival_reason
            ? visit.late_arrival_reason.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            : undefined,
        };
      });

      console.log('[useLateArrivalsData] Processed', totalLateArrivals, 'late arrivals');

      return {
        summary: {
          totalLateArrivals,
          totalVisits,
          lateRate,
          averageMinutesLate,
          topStaffWithLateArrivals,
        },
        byStaff,
        byReason,
        trends,
        reasonTrends,
        recentLateArrivals,
      };
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
