
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCarerAuth } from "./useCarerAuth";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns";

export interface AttendanceMetrics {
  totalHoursWorked: number;
  attendanceRate: number;
  averageDailyHours: number;
  overtimeHours: number;
  punctualityScore: number;
  totalScheduledDays: number;
  presentDays: number;
  lateDays: number;
}

export interface DailyAttendance {
  date: string;
  hoursWorked: number;
  status: string;
  isLate: boolean;
  scheduledHours: number;
}

export interface WeeklyPattern {
  dayName: string;
  averageHours: number;
  attendanceCount: number;
}

export interface AttendanceReportsData {
  metrics: AttendanceMetrics;
  dailyAttendance: DailyAttendance[];
  weeklyPatterns: WeeklyPattern[];
  statusDistribution: { name: string; value: number }[];
  overtimeAnalysis: { month: string; overtimeHours: number }[];
}

export const useCarerAttendanceReports = (dateRange?: { from: Date; to: Date }) => {
  const { carerProfile } = useCarerAuth();
  
  return useQuery({
    queryKey: ['carer-attendance-reports', carerProfile?.id, dateRange],
    queryFn: async (): Promise<AttendanceReportsData> => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const startDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const endDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      console.log('Fetching attendance data for carer:', carerProfile.id, 'Date range:', startDate, 'to', endDate);

      // Fetch attendance records for the carer
      const { data: attendanceRecords, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('person_id', carerProfile.id)
        .eq('person_type', 'staff')
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      if (error) {
        console.error('Error fetching attendance records:', error);
        throw error;
      }

      console.log('Retrieved attendance records:', attendanceRecords?.length || 0);

      // Process the data into the required format
      const processedData = processAttendanceData(attendanceRecords || []);
      
      return processedData;
    },
    enabled: !!carerProfile?.id,
    retry: 2,
  });
};

function processAttendanceData(records: any[]): AttendanceReportsData {
  console.log('Processing attendance data for', records.length, 'records');

  // Calculate basic metrics
  const totalHoursWorked = records.reduce((sum, record) => sum + (record.hours_worked || 0), 0);
  const presentDays = records.filter(record => record.status === 'present').length;
  const lateDays = records.filter(record => record.status === 'late').length;
  const totalScheduledDays = records.length;
  const attendanceRate = totalScheduledDays > 0 ? (presentDays / totalScheduledDays) * 100 : 0;
  const averageDailyHours = presentDays > 0 ? totalHoursWorked / presentDays : 0;
  
  // Calculate overtime (assuming 8 hours is standard workday)
  const overtimeHours = records.reduce((sum, record) => {
    const hours = record.hours_worked || 0;
    return sum + Math.max(0, hours - 8);
  }, 0);

  // Calculate punctuality score
  const punctualityScore = totalScheduledDays > 0 ? ((presentDays - lateDays) / totalScheduledDays) * 100 : 100;

  const metrics: AttendanceMetrics = {
    totalHoursWorked,
    attendanceRate,
    averageDailyHours,
    overtimeHours,
    punctualityScore,
    totalScheduledDays,
    presentDays,
    lateDays,
  };

  // Process daily attendance
  const dailyAttendance: DailyAttendance[] = records.map(record => ({
    date: record.attendance_date,
    hoursWorked: record.hours_worked || 0,
    status: record.status,
    isLate: record.status === 'late',
    scheduledHours: 8, // Default assumption
  }));

  // Process weekly patterns
  const weeklyData = new Map<string, { totalHours: number; count: number }>();
  
  records.forEach(record => {
    if (record.status === 'present' || record.status === 'late') {
      const date = parseISO(record.attendance_date);
      const dayName = format(date, 'EEEE');
      const current = weeklyData.get(dayName) || { totalHours: 0, count: 0 };
      
      weeklyData.set(dayName, {
        totalHours: current.totalHours + (record.hours_worked || 0),
        count: current.count + 1,
      });
    }
  });

  const weeklyPatterns: WeeklyPattern[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .map(dayName => {
      const data = weeklyData.get(dayName) || { totalHours: 0, count: 0 };
      return {
        dayName: dayName.substring(0, 3), // Short day name
        averageHours: data.count > 0 ? data.totalHours / data.count : 0,
        attendanceCount: data.count,
      };
    });

  // Status distribution
  const statusCounts = new Map<string, number>();
  records.forEach(record => {
    const current = statusCounts.get(record.status) || 0;
    statusCounts.set(record.status, current + 1);
  });

  const statusDistribution = Array.from(statusCounts.entries()).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Overtime analysis by month
  const monthlyOvertime = new Map<string, number>();
  records.forEach(record => {
    if (record.hours_worked > 8) {
      const date = parseISO(record.attendance_date);
      const monthKey = format(date, 'MMM yyyy');
      const overtime = record.hours_worked - 8;
      const current = monthlyOvertime.get(monthKey) || 0;
      monthlyOvertime.set(monthKey, current + overtime);
    }
  });

  const overtimeAnalysis = Array.from(monthlyOvertime.entries()).map(([month, overtimeHours]) => ({
    month,
    overtimeHours,
  }));

  console.log('Processed attendance metrics:', metrics);

  return {
    metrics,
    dailyAttendance,
    weeklyPatterns,
    statusDistribution,
    overtimeAnalysis,
  };
}
