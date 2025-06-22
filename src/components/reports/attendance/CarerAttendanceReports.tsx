
import React from "react";
import { Loader2 } from "lucide-react";
import { useCarerAttendanceReports } from "@/hooks/useCarerAttendanceReports";
import { AttendanceMetricsCards } from "./AttendanceMetricsCards";
import { AttendanceChartsGrid } from "./AttendanceChartsGrid";

interface CarerAttendanceReportsProps {
  dateRange?: { from: Date; to: Date };
}

export function CarerAttendanceReports({ dateRange }: CarerAttendanceReportsProps) {
  const { data: attendanceData, isLoading, error } = useCarerAttendanceReports(dateRange);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">Error loading attendance reports</p>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading attendance reports...</span>
        </div>
        <AttendanceMetricsCards 
          metrics={{
            totalHoursWorked: 0,
            attendanceRate: 0,
            averageDailyHours: 0,
            overtimeHours: 0,
            punctualityScore: 0,
            totalScheduledDays: 0,
            presentDays: 0,
            lateDays: 0,
          }} 
          isLoading={true} 
        />
        <AttendanceChartsGrid 
          data={{
            metrics: {
              totalHoursWorked: 0,
              attendanceRate: 0,
              averageDailyHours: 0,
              overtimeHours: 0,
              punctualityScore: 0,
              totalScheduledDays: 0,
              presentDays: 0,
              lateDays: 0,
            },
            dailyAttendance: [],
            weeklyPatterns: [],
            statusDistribution: [],
            overtimeAnalysis: [],
          }} 
          isLoading={true} 
        />
      </div>
    );
  }

  if (!attendanceData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No attendance data available for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AttendanceMetricsCards metrics={attendanceData.metrics} />
      <AttendanceChartsGrid data={attendanceData} />
    </div>
  );
}
