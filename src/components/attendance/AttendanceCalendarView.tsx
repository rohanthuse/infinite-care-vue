import React, { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AttendanceSummaryCards } from "./AttendanceSummaryCards";
import { AttendanceStaffSidebar } from "./AttendanceStaffSidebar";
import { AttendanceMonthCalendar } from "./AttendanceMonthCalendar";
import { AttendanceExportDropdown } from "./AttendanceExportDropdown";
import { useAttendanceRecords } from "@/hooks/useAttendanceRecords";
import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";

interface AttendanceCalendarViewProps {
  branchId: string;
  branchName: string;
}

export const AttendanceCalendarView: React.FC<AttendanceCalendarViewProps> = ({
  branchId,
  branchName,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const filters = {
    dateRange: {
      from: monthStart,
      to: monthEnd,
    },
  };

  const { data: allAttendanceRecords = [], isLoading: loadingAttendance } = useAttendanceRecords(
    branchId,
    filters
  );

  const { staff = [], isLoading: loadingStaff } = useBranchStaffAndClients(branchId);

  // Filter by selected staff if needed
  const attendanceRecords = useMemo(() => {
    if (!selectedStaffId) return allAttendanceRecords;
    
    // Find the selected staff member to get their auth_user_id
    const selectedStaff = staff.find(s => s.id === selectedStaffId);
    const authUserId = selectedStaff?.auth_user_id;
    
    // Filter by either staff.id or auth_user_id
    return allAttendanceRecords.filter((r) => 
      r.person_id === selectedStaffId || r.person_id === authUserId
    );
  }, [selectedStaffId, allAttendanceRecords, staff]);

  // Process staff summaries
  const staffSummaries = useMemo(() => {
    return staff.map((member) => {
      // Match records by either staff.id or auth_user_id
      const memberRecords = allAttendanceRecords.filter(
        (r) => r.person_type === "staff" && 
          (r.person_id === member.id || r.person_id === member.auth_user_id)
      );

      const totalHours = memberRecords.reduce(
        (sum, r) => sum + (r.hours_worked || 0),
        0
      );

      const presentDays = memberRecords.filter(
        (r) => r.status.toLowerCase() === "present" || r.status.toLowerCase() === "late"
      ).length;

      const absentDays = memberRecords.filter(
        (r) => r.status.toLowerCase() === "absent"
      ).length;

      const totalDays = memberRecords.length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

      return {
        id: member.id,
        name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
        attendanceRate,
        totalHours,
        absentDays,
      };
    });
  }, [staff, allAttendanceRecords]);

  // Process calendar data
  const calendarData = useMemo(() => {
    return attendanceRecords.map((record) => {
      // Use the person_name already resolved by useAttendanceRecords
      // which handles both staff.id and auth_user_id lookups
      const staffName = record.person_name || "Unknown";

      return {
        staffName,
        date: record.attendance_date,
        checkIn: record.check_in_time
          ? format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")
          : null,
        checkOut: record.check_out_time
          ? format(new Date(`2000-01-01T${record.check_out_time}`), "HH:mm")
          : null,
        hoursWorked: record.hours_worked,
        status: record.status,
        personType: record.person_type,
      };
    });
  }, [attendanceRecords]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalHours = attendanceRecords.reduce(
      (sum, r) => sum + (r.hours_worked || 0),
      0
    );

    const presentDays = attendanceRecords.filter(
      (r) => r.status.toLowerCase() === "present" || r.status.toLowerCase() === "late"
    ).length;

    const absentDays = attendanceRecords.filter(
      (r) => r.status.toLowerCase() === "absent"
    ).length;

    const lateDays = attendanceRecords.filter(
      (r) => r.status.toLowerCase() === "late"
    ).length;

    const totalDays = attendanceRecords.length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalHours,
      attendanceRate,
      absentDays,
      lateDays,
    };
  }, [attendanceRecords]);

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isLoading = loadingAttendance || loadingStaff;

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentMonth, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentMonth}
                onSelect={(date) => date && setCurrentMonth(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <AttendanceExportDropdown
          branchId={branchId}
          branchName={branchName}
          currentDate={currentMonth}
          attendanceData={calendarData.map((d) => ({
            staffName: d.staffName,
            date: d.date,
            checkIn: d.checkIn,
            checkOut: d.checkOut,
            hours: d.hoursWorked,
            status: d.status,
          }))}
          totalHours={summaryStats.totalHours}
          attendanceRate={summaryStats.attendanceRate}
          absentDays={summaryStats.absentDays}
          lateDays={summaryStats.lateDays}
        />
      </div>

      {/* Summary cards */}
      <AttendanceSummaryCards {...summaryStats} />

      {/* Main content area */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading attendance data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Staff sidebar */}
          <div className="lg:col-span-1">
            <AttendanceStaffSidebar
              staff={staffSummaries}
              selectedStaffId={selectedStaffId}
              onSelectStaff={setSelectedStaffId}
            />
          </div>

          {/* Calendar view */}
          <div className="lg:col-span-3">
            <AttendanceMonthCalendar
              currentMonth={currentMonth}
              attendanceData={calendarData}
              branchId={branchId}
              selectedStaffId={selectedStaffId}
            />
          </div>
        </div>
      )}
    </div>
  );
};
