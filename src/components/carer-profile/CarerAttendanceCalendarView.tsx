import React, { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LogIn,
  LogOut,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AttendanceDayDetailCard } from "./AttendanceDayDetailPopover";
import { cn } from "@/lib/utils";

interface CarerAttendanceCalendarViewProps {
  carerId: string;
}

type ViewType = "weekly" | "monthly";

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  hours_worked: number | null;
  notes: string | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  present: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    icon: "✓",
  },
  late: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    icon: "◐",
  },
  absent: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    icon: "✕",
  },
  sick: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    icon: "🏥",
  },
  holiday: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    icon: "🌴",
  },
  excused: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
    icon: "○",
  },
  half_day: {
    bg: "bg-cyan-100 dark:bg-cyan-900/30",
    text: "text-cyan-700 dark:text-cyan-400",
    icon: "½",
  },
};

const getStatusColor = (status: string) => {
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.present;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const CarerAttendanceCalendarView: React.FC<CarerAttendanceCalendarViewProps> = ({
  carerId,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate date range based on view type
  const dateRange = useMemo(() => {
    if (viewType === "weekly") {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
      };
    } else {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
      };
    }
  }, [currentDate, viewType]);

  // Fetch attendance records for the date range
  const { data: attendanceRecords, isLoading } = useQuery({
    queryKey: ["carer-attendance-calendar", carerId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("person_id", carerId)
        .eq("person_type", "staff")
        .gte("attendance_date", format(dateRange.start, "yyyy-MM-dd"))
        .lte("attendance_date", format(dateRange.end, "yyyy-MM-dd"));

      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!carerId,
  });

  // Create a map of records by date for quick lookup
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords?.forEach((record) => {
      map.set(record.attendance_date, record);
    });
    return map;
  }, [attendanceRecords]);

  // Get selected day's record
  const selectedRecord = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return recordsByDate.get(dateStr) || null;
  }, [selectedDate, recordsByDate]);

  // Calculate summary stats
  const summary = useMemo(() => {
    if (!attendanceRecords) return { present: 0, late: 0, absent: 0, totalHours: 0 };
    
    return attendanceRecords.reduce(
      (acc, record) => {
        const status = record.status.toLowerCase();
        if (status === "present") acc.present++;
        else if (status === "late") acc.late++;
        else if (status === "absent") acc.absent++;
        if (record.hours_worked) acc.totalHours += record.hours_worked;
        return acc;
      },
      { present: 0, late: 0, absent: 0, totalHours: 0 }
    );
  }, [attendanceRecords]);

  // Navigation handlers
  const handlePrevious = () => {
    if (viewType === "weekly") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewType === "weekly") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Get days to display
  const daysToDisplay = useMemo(() => {
    if (viewType === "weekly") {
      return eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    } else {
      // For monthly view, include days from previous/next month to fill the grid
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }
  }, [viewType, currentDate, dateRange]);

  // Render weekly view
  const renderWeeklyView = () => (
    <div className="grid grid-cols-7 gap-2">
      {daysToDisplay.map((day) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const record = recordsByDate.get(dateStr);
        const statusColor = record ? getStatusColor(record.status) : null;
        const isSelected = isSameDay(day, selectedDate);

        return (
          <Card
            key={dateStr}
            onClick={() => setSelectedDate(day)}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md border",
              isSelected && "ring-2 ring-primary shadow-md",
              isToday(day) && !isSelected && "ring-1 ring-primary/50",
              record ? statusColor?.bg : "bg-muted/30"
            )}
          >
            <CardContent className="p-3">
              {/* Date Header */}
              <div className="text-center mb-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(day, "EEE")}
                </p>
                <p className={cn(
                  "text-lg font-bold",
                  isToday(day) ? "text-primary" : "text-foreground"
                )}>
                  {format(day, "d")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(day, "MMM")}
                </p>
              </div>
              
              {/* Inline Attendance Details */}
              {record ? (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Badge
                    variant="custom"
                    className={cn("text-xs w-full justify-center", statusColor?.bg, statusColor?.text)}
                  >
                    {record.status}
                  </Badge>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LogIn className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span>
                      {record.check_in_time
                        ? format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")
                        : "-"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <LogOut className="h-3 w-3 text-red-600 dark:text-red-400" />
                    <span>
                      {record.check_out_time
                        ? format(new Date(`2000-01-01T${record.check_out_time}`), "HH:mm")
                        : "-"}
                    </span>
                  </div>
                  
                  {record.hours_worked != null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {record.hours_worked.toFixed(1)}h
                      </span>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span className="truncate" title={record.notes}>Note</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground text-center">No record</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Render monthly view
  const renderMonthlyView = () => (
    <div className="space-y-1">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {daysToDisplay.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const record = recordsByDate.get(dateStr);
          const statusColor = record ? getStatusColor(record.status) : null;
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "min-h-[100px] p-2 rounded-lg cursor-pointer transition-all hover:shadow-md border",
                isSelected && "ring-2 ring-primary shadow-md",
                isToday(day) && !isSelected && "ring-1 ring-primary/50",
                !isCurrentMonth && "opacity-40",
                record ? statusColor?.bg : "bg-card hover:bg-muted/50"
              )}
            >
              <div className="flex flex-col h-full">
                {/* Day Number */}
                <span
                  className={cn(
                    "text-sm font-medium mb-1",
                    isToday(day) ? "text-primary" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </span>
                
                {/* Inline Details */}
                {record && (
                  <div className="flex-1 space-y-1">
                    <Badge
                      variant="custom"
                      className={cn("text-xs", statusColor?.bg, statusColor?.text)}
                    >
                      {statusColor?.icon} {record.status}
                    </Badge>
                    
                    <div className="text-xs text-muted-foreground">
                      {record.check_in_time && record.check_out_time ? (
                        <span>
                          {format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")}
                          {" - "}
                          {format(new Date(`2000-01-01T${record.check_out_time}`), "HH:mm")}
                        </span>
                      ) : record.check_in_time ? (
                        <span>In: {format(new Date(`2000-01-01T${record.check_in_time}`), "HH:mm")}</span>
                      ) : null}
                    </div>
                    
                    {record.hours_worked != null && (
                      <div className="text-xs font-medium text-foreground">
                        {record.hours_worked.toFixed(1)}h
                      </div>
                    )}
                    
                    {record.notes && (
                      <FileText className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary.totalHours.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Total Hours</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold text-foreground min-w-[200px] text-center">
            {viewType === "weekly"
              ? `${format(dateRange.start, "MMM d")} - ${format(dateRange.end, "MMM d, yyyy")}`
              : format(currentDate, "MMMM yyyy")}
          </h3>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <Button
              variant={viewType === "weekly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewType("weekly")}
            >
              Weekly
            </Button>
            <Button
              variant={viewType === "monthly" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewType("monthly")}
            >
              Monthly
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar View with Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Calendar Grid - Takes 3 columns on large screens */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-4">
              {viewType === "weekly" ? renderWeeklyView() : renderMonthlyView()}
            </CardContent>
          </Card>
        </div>

        {/* Selected Day Details Panel - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <AttendanceDayDetailCard date={selectedDate} record={selectedRecord} />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(STATUS_COLORS).map(([status, config]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded", config.bg)} />
            <span className="capitalize text-muted-foreground">{status.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
