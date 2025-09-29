import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfWeek, endOfWeek } from 'date-fns';

interface StaffUtilizationData {
  id: string;
  name: string;
  contractedHours: number;
  scheduledHours: number;
  actualHours: number;
  availableHours: number;
  revenue: number;
  bookingsCount: number;
  efficiency: number;
  lastWeekHours: number;
  rank: number;
}

interface BookingData {
  staff_id: string;
  start_time: string;
  end_time: string;
  revenue?: number;
  status: string;
}

interface StaffData {
  id: string;
  first_name: string;
  last_name: string;
  availability?: string;
  experience?: string;
}

const fetchStaffUtilizationData = async (branchId: string, date: Date): Promise<StaffUtilizationData[]> => {
  const currentDateStr = format(date, 'yyyy-MM-dd');
  const weekStart = format(startOfWeek(date), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd');
  const lastWeekStart = format(startOfWeek(subDays(date, 7)), 'yyyy-MM-dd');
  const lastWeekEnd = format(endOfWeek(subDays(date, 7)), 'yyyy-MM-dd');

  // Fetch staff data
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, first_name, last_name, availability, experience')
    .eq('branch_id', branchId)
    .eq('status', 'Active');

  if (staffError) throw staffError;

  // Fetch current week bookings
  const { data: currentBookings, error: currentBookingsError } = await supabase
    .from('bookings')
    .select('staff_id, start_time, end_time, revenue, status')
    .eq('branch_id', branchId)
    .gte('start_time', weekStart)
    .lte('start_time', weekEnd);

  if (currentBookingsError) throw currentBookingsError;

  // Fetch last week bookings for trend analysis
  const { data: lastWeekBookings, error: lastWeekBookingsError } = await supabase
    .from('bookings')
    .select('staff_id, start_time, end_time, revenue, status')
    .eq('branch_id', branchId)
    .gte('start_time', lastWeekStart)
    .lte('start_time', lastWeekEnd);

  if (lastWeekBookingsError) throw lastWeekBookingsError;

  // Process data for each staff member
  const utilizationData: StaffUtilizationData[] = (staff || []).map((member: StaffData) => {
    // Calculate contracted hours based on availability
    let contractedHours = 40; // Default full-time
    if (member.availability?.includes('Part-time')) {
      contractedHours = 20;
    } else if (member.availability?.includes('Casual')) {
      contractedHours = 16;
    }

    // Filter bookings for this staff member
    const memberCurrentBookings = (currentBookings || []).filter(
      (booking: BookingData) => booking.staff_id === member.id
    );

    const memberLastWeekBookings = (lastWeekBookings || []).filter(
      (booking: BookingData) => booking.staff_id === member.id
    );

    // Calculate scheduled hours (total booking duration)
    const scheduledHours = memberCurrentBookings.reduce((total, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Calculate actual hours (completed bookings only)
    const actualHours = memberCurrentBookings
      .filter((booking: BookingData) => booking.status === 'done')
      .reduce((total, booking) => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }, 0);

    // Calculate last week hours for trend analysis
    const lastWeekHours = memberLastWeekBookings.reduce((total, booking) => {
      const start = new Date(booking.start_time);
      const end = new Date(booking.end_time);
      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Calculate revenue
    const revenue = memberCurrentBookings.reduce((total, booking) => {
      return total + (booking.revenue || 25); // Default £25 per booking if not specified
    }, 0);

    // Calculate efficiency (actual vs scheduled)
    const efficiency = scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : 0;

    // Available hours (contracted - scheduled)
    const availableHours = Math.max(0, contractedHours - scheduledHours);

    return {
      id: member.id,
      name: `${member.first_name} ${member.last_name}`,
      contractedHours,
      scheduledHours: Number(scheduledHours.toFixed(2)),
      actualHours: Number(actualHours.toFixed(2)),
      availableHours: Number(availableHours.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
      bookingsCount: memberCurrentBookings.length,
      efficiency: Number(efficiency.toFixed(1)),
      lastWeekHours: Number(lastWeekHours.toFixed(2)),
      rank: 0, // Will be calculated after sorting
    };
  });

  // Calculate rankings based on utilization rate
  const sortedData = utilizationData
    .sort((a, b) => {
      const aUtilization = (a.scheduledHours / a.contractedHours) * 100;
      const bUtilization = (b.scheduledHours / b.contractedHours) * 100;
      return bUtilization - aUtilization;
    })
    .map((staff, index) => ({
      ...staff,
      rank: index + 1,
    }));

  return sortedData;
};

export const useStaffUtilizationAnalytics = (branchId?: string, date?: Date) => {
  const currentDate = date || new Date();
  
  return useQuery({
    queryKey: ['staff-utilization-analytics', branchId, format(currentDate, 'yyyy-MM-dd')],
    queryFn: () => {
      if (!branchId) throw new Error('Branch ID is required');
      return fetchStaffUtilizationData(branchId, currentDate);
    },
    enabled: Boolean(branchId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

// Hook for enhanced staff schedule data with utilization metrics
export const useEnhancedStaffSchedule = (
  staffData: any[], 
  bookings: any[], 
  date: Date
) => {
  return useMemo(() => {
    return staffData.map(staff => {
      // Filter bookings for this staff member on the selected date
      const dayBookings = bookings.filter(booking => 
        booking.carerId === staff.id && 
        booking.date === format(date, 'yyyy-MM-dd')
      );

      // Calculate hours for the day
      const scheduledHours = dayBookings.reduce((total, booking) => {
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return total + duration;
      }, 0);

      const completedBookings = dayBookings.filter(booking => booking.status === 'done');
      const actualHours = completedBookings.reduce((total, booking) => {
        const [startHour, startMin] = booking.startTime.split(':').map(Number);
        const [endHour, endMin] = booking.endTime.split(':').map(Number);
        const duration = (endHour * 60 + endMin - startHour * 60 - startMin) / 60;
        return total + duration;
      }, 0);

      // Enhanced metrics
      const contractedHours = 8; // TODO: Get from staff profile
      const utilizationRate = (scheduledHours / contractedHours) * 100;
      const efficiency = scheduledHours > 0 ? (actualHours / scheduledHours) * 100 : 0;
      const revenue = dayBookings.length * 25; // £25 per booking (mock calculation)
      const availableHours = Math.max(0, contractedHours - scheduledHours);

      return {
        ...staff,
        scheduledHours: Number(scheduledHours.toFixed(2)),
        actualHours: Number(actualHours.toFixed(2)),
        contractedHours,
        utilizationRate: Number(utilizationRate.toFixed(1)),
        efficiency: Number(efficiency.toFixed(1)),
        revenue: Number(revenue.toFixed(2)),
        availableHours: Number(availableHours.toFixed(2)),
        bookingsCount: dayBookings.length,
        completedBookings: completedBookings.length,
        revenuePerHour: actualHours > 0 ? revenue / actualHours : 0,
      };
    });
  }, [staffData, bookings, date]);
};