import React from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle } from "lucide-react";

interface AttendanceRecord {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number | null;
  status: string;
}

interface AttendanceMonthCalendarProps {
  currentMonth: Date;
  attendanceData: AttendanceRecord[];
}

export const AttendanceMonthCalendar: React.FC<AttendanceMonthCalendarProps> = ({
  currentMonth,
  attendanceData,
}) => {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getAttendanceForDay = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return attendanceData.find((a) => a.date === dateStr);
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
            const attendance = getAttendanceForDay(day);
            const statusColor = getStatusColor(
              attendance?.status || "",
              isCurrentMonth
            );

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] p-2 rounded-lg border-2 transition-all",
                  statusColor,
                  !isCurrentMonth && "opacity-40"
                )}
              >
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>

                {attendance && isCurrentMonth ? (
                  <div className="space-y-1 text-xs">
                    {attendance.status.toLowerCase() === "absent" ? (
                      <div className="flex items-center gap-1 text-destructive font-semibold">
                        <AlertCircle className="h-3 w-3" />
                        <span>ABSENT</span>
                      </div>
                    ) : (
                      <>
                        {attendance.checkIn && (
                          <div className="flex items-center gap-1">
                            <span className="text-green-600 dark:text-green-400">↗</span>
                            <span>{attendance.checkIn}</span>
                          </div>
                        )}
                        {attendance.checkOut && (
                          <div className="flex items-center gap-1">
                            <span className="text-red-600 dark:text-red-400">↘</span>
                            <span>{attendance.checkOut}</span>
                          </div>
                        )}
                        {attendance.hoursWorked !== null && (
                          <div className="flex items-center gap-1 font-semibold">
                            <Clock className="h-3 w-3" />
                            <span>{attendance.hoursWorked.toFixed(1)}h</span>
                          </div>
                        )}
                        {attendance.status.toLowerCase() === "late" && (
                          <div className="text-amber-600 dark:text-amber-400 font-semibold">
                            LATE
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
          })}
        </div>
      </CardContent>
    </Card>
  );
};
