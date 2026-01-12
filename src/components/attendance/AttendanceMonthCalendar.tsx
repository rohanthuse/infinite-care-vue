import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";
import { useAnnualLeave, AnnualLeave } from "@/hooks/useLeaveManagement";
import { isHolidayOnDate } from "@/utils/holidayHelpers";

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null;
  status: string;
  staffName: string;
  personType?: string;
}

interface AttendanceMonthCalendarProps {
  currentMonth: Date;
  attendanceData: AttendanceRecord[];
  branchId?: string;
}

export const AttendanceMonthCalendar: React.FC<AttendanceMonthCalendarProps> = ({
  currentMonth,
  attendanceData,
  branchId,
}) => {
  // Fetch holidays for the branch
  const { data: holidays = [] } = useAnnualLeave(branchId);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAllAttendanceForDay = (day: Date): AttendanceRecord[] => {
    const dateStr = format(day, "yyyy-MM-dd");
    return attendanceData.filter((a) => a.date === dateStr);
  };

  const getHolidayForDay = (day: Date): AnnualLeave | null => {
    return holidays.find(holiday => isHolidayOnDate(holiday, day)) || null;
  };

  const getStatusColor = (status: string, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return "bg-muted/50";
    
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700";
      case "absent":
        return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700";
      case "late":
        return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700";
      case "leave":
        return "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700";
      default:
        return "bg-background border-border";
    }
  };

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const AttendanceDayTooltip: React.FC<{ records: AttendanceRecord[], date: Date }> = ({ records, date }) => {
    if (records.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <div className="font-semibold border-b pb-2">
          {format(date, "EEEE, d MMMM yyyy")}
          <span className="ml-2 text-muted-foreground font-normal">
            ({records.length} {records.length === 1 ? 'staff' : 'staff'})
          </span>
        </div>
        
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {records.map((record, idx) => (
            <div key={idx} className="border-l-2 border-primary pl-3 py-1">
              <div className="font-medium text-sm flex items-center gap-2">
                {record.staffName}
                {record.personType && (
                  <span className="text-xs text-muted-foreground capitalize">
                    ({record.personType})
                  </span>
                )}
              </div>
              <div className="text-xs space-y-1 mt-1">
                {record.status.toLowerCase() === "absent" ? (
                  <div className="flex items-center gap-1 text-destructive font-semibold">
                    <AlertCircle className="h-3 w-3" />
                    <span>ABSENT</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 dark:text-green-400">↗ Check-In:</span>
                      <span>{record.checkIn || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 dark:text-red-400">↘ Check-Out:</span>
                      <span>{record.checkOut || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>Total Hours:</span>
                      <span className="font-semibold">
                        {record.hoursWorked?.toFixed(2) || '0.00'} hrs
                      </span>
                    </div>
                    {record.status.toLowerCase() === "late" && (
                      <div className="text-amber-600 dark:text-amber-400 font-semibold">
                        LATE
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {format(currentMonth, "MMMM yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-muted-foreground pb-2"
            >
              {day}
            </div>
          ))}

          {days.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const dayRecords = getAllAttendanceForDay(day);
            const dayHoliday = getHolidayForDay(day);
            const hasAttendance = dayRecords.length > 0;
            
            // Determine overall status for coloring (prioritize present/late over absent)
            const presentCount = dayRecords.filter(r => 
              r.status.toLowerCase() === 'present' || r.status.toLowerCase() === 'late'
            ).length;
            const absentCount = dayRecords.filter(r => r.status.toLowerCase() === 'absent').length;
            
            let overallStatus = '';
            if (hasAttendance) {
              if (presentCount > 0) {
                overallStatus = dayRecords.some(r => r.status.toLowerCase() === 'late') ? 'late' : 'present';
              } else if (absentCount > 0) {
                overallStatus = 'absent';
              }
            }
            
            const statusColor = getStatusColor(overallStatus, isCurrentMonth);

            const dayCell = (
              <div
                className={cn(
                  "min-h-[100px] p-2 rounded-lg border-2 transition-all",
                  statusColor,
                  !isCurrentMonth && "opacity-40",
                  hasAttendance && isCurrentMonth && "cursor-pointer hover:shadow-md hover:scale-[1.02]"
                )}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>

                {/* Holiday indicator */}
                {dayHoliday && isCurrentMonth && (
                  <div className="mb-2 p-1.5 rounded bg-teal-400 border-l-2 border-teal-600 text-white text-xs">
                    <div className="font-semibold flex items-center gap-1">
                      <span className="bg-white text-teal-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        H
                      </span>
                      <span className="truncate">{dayHoliday.leave_name}</span>
                    </div>
                  </div>
                )}

                {hasAttendance && isCurrentMonth ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">
                      {dayRecords.length} {dayRecords.length === 1 ? 'staff' : 'staff'}
                    </div>
                    {dayRecords.length === 1 ? (
                      // Show single staff details
                      <>
                        {dayRecords[0].status.toLowerCase() === "absent" ? (
                          <div className="flex items-center gap-1 text-destructive font-semibold">
                            <AlertCircle className="h-3 w-3" />
                            <span>ABSENT</span>
                          </div>
                        ) : (
                          <>
                            {dayRecords[0].checkIn && (
                              <div className="flex items-center gap-1">
                                <span className="text-green-600 dark:text-green-400">↗</span>
                                <span>{dayRecords[0].checkIn}</span>
                              </div>
                            )}
                            {dayRecords[0].checkOut && (
                              <div className="flex items-center gap-1">
                                <span className="text-red-600 dark:text-red-400">↘</span>
                                <span>{dayRecords[0].checkOut}</span>
                              </div>
                            )}
                            {dayRecords[0].hoursWorked !== null && (
                              <div className="flex items-center gap-1 font-semibold">
                                <Clock className="h-3 w-3" />
                                <span>{dayRecords[0].hoursWorked.toFixed(1)}h</span>
                              </div>
                            )}
                            {dayRecords[0].status.toLowerCase() === "late" && (
                              <div className="text-amber-600 dark:text-amber-400 font-semibold">
                                LATE
                              </div>
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      // Show summary for multiple staff
                      <>
                        <div className="text-muted-foreground">
                          {dayRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0).toFixed(1)}h total
                        </div>
                        {presentCount > 0 && (
                          <div className="text-green-600 dark:text-green-400 text-[10px]">
                            {presentCount} present
                          </div>
                        )}
                        {absentCount > 0 && (
                          <div className="text-red-600 dark:text-red-400 text-[10px]">
                            {absentCount} absent
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  isCurrentMonth && (
                    <div className="text-xs text-muted-foreground">No data</div>
                  )
                )}
              </div>
            );

            // Add HoverCard if there's attendance data or holiday
            if ((hasAttendance || dayHoliday) && isCurrentMonth) {
              return (
                <HoverCard key={idx} openDelay={200} closeDelay={100}>
                  <HoverCardTrigger asChild>{dayCell}</HoverCardTrigger>
                  <HoverCardContent className="w-80" side="top">
                    {dayHoliday && (
                      <div className="mb-3 pb-3 border-b">
                        <div className="font-semibold text-teal-600 flex items-center gap-2">
                          <span>🎄 {dayHoliday.leave_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          📅 {format(day, "MMMM d, yyyy")}
                        </div>
                      </div>
                    )}
                    {hasAttendance && <AttendanceDayTooltip records={dayRecords} date={day} />}
                  </HoverCardContent>
                </HoverCard>
              );
            }

            return <React.Fragment key={idx}>{dayCell}</React.Fragment>;
          })}
        </div>
      </CardContent>
    </Card>
  );
};
