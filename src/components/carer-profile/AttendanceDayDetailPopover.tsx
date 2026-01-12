import React from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, FileText, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  notes: string | null;
}

interface AttendanceDayDetailCardProps {
  date: Date;
  record: AttendanceRecord | null;
}

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; bgClass: string; textClass: string }> = {
    present: {
      label: "Present",
      bgClass: "bg-green-100 dark:bg-green-900/30",
      textClass: "text-green-700 dark:text-green-400",
    },
    late: {
      label: "Late",
      bgClass: "bg-amber-100 dark:bg-amber-900/30",
      textClass: "text-amber-700 dark:text-amber-400",
    },
    absent: {
      label: "Absent",
      bgClass: "bg-red-100 dark:bg-red-900/30",
      textClass: "text-red-700 dark:text-red-400",
    },
    sick: {
      label: "Sick Leave",
      bgClass: "bg-blue-100 dark:bg-blue-900/30",
      textClass: "text-blue-700 dark:text-blue-400",
    },
    holiday: {
      label: "Holiday",
      bgClass: "bg-purple-100 dark:bg-purple-900/30",
      textClass: "text-purple-700 dark:text-purple-400",
    },
    excused: {
      label: "Excused",
      bgClass: "bg-gray-100 dark:bg-gray-800/50",
      textClass: "text-gray-600 dark:text-gray-400",
    },
    half_day: {
      label: "Half Day",
      bgClass: "bg-cyan-100 dark:bg-cyan-900/30",
      textClass: "text-cyan-700 dark:text-cyan-400",
    },
  };

  return configs[status.toLowerCase()] || configs.present;
};

export const AttendanceDayDetailCard: React.FC<AttendanceDayDetailCardProps> = ({
  date,
  record,
}) => {
  const statusConfig = record ? getStatusConfig(record.status) : null;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Selected Day Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Header */}
        <div className="border-b border-border pb-3">
          <p className="text-lg font-semibold text-foreground">
            {format(date, "EEEE")}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>

        {record ? (
          <>
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground min-w-[60px]">Status:</span>
              <Badge
                variant="custom"
                className={cn("text-sm px-3 py-1", statusConfig?.bgClass, statusConfig?.textClass)}
              >
                {statusConfig?.label}
              </Badge>
            </div>

            {/* Check-in Time */}
            <div className="flex items-center gap-3">
              <LogIn className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-sm text-muted-foreground min-w-[60px]">Check In:</span>
              <span className="text-sm font-medium text-foreground">
                {record.check_in_time
                  ? format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")
                  : "Not recorded"}
              </span>
            </div>

            {/* Check-out Time */}
            <div className="flex items-center gap-3">
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-sm text-muted-foreground min-w-[60px]">Check Out:</span>
              <span className="text-sm font-medium text-foreground">
                {record.check_out_time
                  ? format(new Date(`2000-01-01T${record.check_out_time}`), "HH:mm")
                  : "Not recorded"}
              </span>
            </div>

            {/* Hours Worked */}
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground min-w-[60px]">Hours:</span>
              <span className="text-sm font-medium text-foreground">
                {record.hours_worked != null
                  ? `${record.hours_worked.toFixed(1)} hours`
                  : "Not calculated"}
              </span>
            </div>

            {/* Notes */}
            {record.notes && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2">
                      {record.notes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No attendance record</p>
            <p className="text-xs text-muted-foreground mt-1">
              No data available for this day
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Keep the old export name for backwards compatibility during transition
export const AttendanceDayDetailPopover = AttendanceDayDetailCard;
