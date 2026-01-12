import React from "react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Clock, LogIn, LogOut, FileText } from "lucide-react";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  notes: string | null;
}

interface AttendanceDayDetailPopoverProps {
  date: Date;
  record: AttendanceRecord | null;
  children: React.ReactNode;
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

export const AttendanceDayDetailPopover: React.FC<AttendanceDayDetailPopoverProps> = ({
  date,
  record,
  children,
}) => {
  const statusConfig = record ? getStatusConfig(record.status) : null;

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="center">
        <div className="space-y-3">
          {/* Date Header */}
          <div className="border-b border-border pb-2">
            <p className="font-semibold text-foreground">
              {format(date, "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          {record ? (
            <>
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant="custom"
                  className={`${statusConfig?.bgClass} ${statusConfig?.textClass}`}
                >
                  {statusConfig?.label}
                </Badge>
              </div>

              {/* Check-in/Check-out Times */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Check In</p>
                    <p className="text-sm font-medium text-foreground">
                      {record.check_in_time
                        ? format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Check Out</p>
                    <p className="text-sm font-medium text-foreground">
                      {record.check_out_time
                        ? format(new Date(`2000-01-01T${record.check_out_time}`), "HH:mm")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hours Worked */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Hours Worked</p>
                  <p className="text-sm font-medium text-foreground">
                    {record.hours_worked != null
                      ? `${record.hours_worked.toFixed(1)} hours`
                      : "-"}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {record.notes && (
                <div className="flex items-start gap-2 pt-2 border-t border-border">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-sm text-foreground">{record.notes}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No attendance record</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
