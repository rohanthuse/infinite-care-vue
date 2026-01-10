import React, { useState } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { DayBookingsDialog } from "./DayBookingsDialog";
import { AnnualLeave } from "@/hooks/useLeaveManagement";
import { AlertTriangle } from "lucide-react";
import { requiresReassignment, getReassignmentBadgeText, getBookingStatusColor, getEffectiveBookingStatus } from "./utils/bookingColors";
import { isHolidayOnDate } from "@/utils/holidayHelpers";

export interface Booking {
  id: string;
  clientId: string;
  clientName: string;
  clientInitials: string;
  carerId: string;
  carerName: string;
  carerInitials: string;
  startTime: string;
  endTime: string;
  date: string;
  status: "assigned" | "unassigned" | "done" | "in-progress" | "cancelled" | "departed" | "suspended";
  notes?: string;
  is_late_start?: boolean;
  is_missed?: boolean;
  late_start_minutes?: number;
  unavailability_request?: {
    id: string;
    status: 'pending' | 'approved' | 'rejected' | 'reassigned';
    reason: string;
    notes?: string;
    requested_at: string;
    reviewed_at?: string;
    admin_notes?: string;
  } | null;
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
  address?: string;
  postcode?: string;
  status?: string;
  active_until?: string | null;
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
}

interface LeaveRequest {
  staff_id: string;
  staff_name?: string;
  leave_type: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface BookingsMonthViewProps {
  date: Date;
  bookings: Booking[];
  clients: Client[];
  carers: Carer[];
  leaveRequests?: LeaveRequest[];
  holidays?: AnnualLeave[];
  isLoading?: boolean;
  onBookingClick?: (booking: Booking) => void;
  onCreateBooking?: (date: Date, time: string, clientId?: string, carerId?: string) => void;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_BOOKINGS = 3;

export const BookingsMonthView: React.FC<BookingsMonthViewProps> = ({
  date,
  bookings,
  clients,
  carers,
  leaveRequests = [],
  holidays = [],
  isLoading = false,
  onBookingClick,
  onCreateBooking,
}) => {
  // State for day bookings dialog
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isDayDialogOpen, setIsDayDialogOpen] = useState(false);

  // Generate calendar days for the month
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date): Booking[] => {
    const dayString = format(day, "yyyy-MM-dd");
    return bookings.filter((booking) => booking.date === dayString);
  };

  // Get leave for a specific day (for staff members)
  const getLeaveForDay = (day: Date): Array<{staffName: string, leaveType: string, staffId: string}> => {
    if (!leaveRequests) return [];
    
    const dayString = format(day, "yyyy-MM-dd");
    return leaveRequests
      .filter((leave) => 
        leave.status === 'approved' &&
        leave.start_date <= dayString &&
        leave.end_date >= dayString
      )
      .map(leave => ({
        staffName: leave.staff_name || 'Unknown',
        leaveType: leave.leave_type,
        staffId: leave.staff_id
      }));
  };

  // Get holiday for a specific day (with recurring support)
  const getHolidayForDay = (day: Date): AnnualLeave | null => {
    if (!holidays) return null;
    
    return holidays.find(holiday => isHolidayOnDate(holiday, day)) || null;
  };

  // Get status color for booking (using effective status for late/missed)
  const getStatusColor = (booking: Booking): string => {
    const effectiveStatus = getEffectiveBookingStatus(booking);
    return getBookingStatusColor(effectiveStatus, 'solid');
  };

  // Handle showing more bookings for a day
  const handleShowMoreBookings = (day: Date, dayBookings: Booking[]) => {
    setSelectedDay(day);
    setIsDayDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const totalBookings = bookings.length;

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">
            {format(date, "MMMM yyyy")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {totalBookings} booking{totalBookings !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {WEEKDAY_LABELS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const dayLeave = getLeaveForDay(day);
            const isCurrentMonth = isSameMonth(day, date);
            const isTodayDate = isToday(day);
            const visibleBookings = dayBookings.slice(0, MAX_VISIBLE_BOOKINGS);
            const overflowCount = dayBookings.length - MAX_VISIBLE_BOOKINGS;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] p-2 rounded-lg border transition-colors",
                  isCurrentMonth
                    ? "bg-background border-border hover:border-primary/50"
                    : "bg-muted/30 border-muted text-muted-foreground",
                  isTodayDate && "ring-2 ring-primary ring-offset-2"
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isTodayDate
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        : isCurrentMonth
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                  {format(day, "d")}
                </span>
                {(dayBookings.length > 0 || dayLeave.length > 0 || getHolidayForDay(day)) && (
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                    {dayBookings.length + dayLeave.length + (getHolidayForDay(day) ? 1 : 0)}
                  </span>
                )}
              </div>

              {/* Bookings, Holidays, and Leave list */}
              <div className="space-y-1">
                {/* Holiday indicator (FIRST) */}
                {(() => {
                  const dayHoliday = getHolidayForDay(day);
                  if (dayHoliday) {
                    return (
                      <div
                        className="text-xs p-1.5 rounded cursor-pointer transition-all hover:opacity-80 hover:shadow-sm border-l-2 bg-teal-400 border-teal-600 text-white"
                        title={`${dayHoliday.leave_name}${dayHoliday.is_recurring ? ' (Recurring Annual Holiday)' : ''}${dayHoliday.is_company_wide ? '\nCompany-wide' : ''}\n${format(day, 'MMMM d, yyyy')}`}
                      >
                        <div className="font-semibold truncate flex items-center gap-1">
                          <span className="bg-white text-teal-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            H
                          </span>
                          <span className="truncate">{dayHoliday.leave_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] opacity-90 ml-5">
                          {dayHoliday.is_recurring && <span>🔁 Recurring</span>}
                          {dayHoliday.is_company_wide && <span>🏢 Company-wide</span>}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Leave indicators (SECOND) */}
                {dayLeave.map((leave) => (
                    <div
                      key={leave.staffId}
                      className="text-xs p-1.5 rounded cursor-pointer transition-all hover:opacity-80 hover:shadow-sm text-white border-l-2 bg-red-400 border-red-600"
                      title={`${leave.staffName} - ${leave.leaveType} leave`}
                    >
                      <div className="font-semibold truncate flex items-center gap-1">
                        <span className="bg-white text-red-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {leave.leaveType === 'annual' ? 'A' :
                           leave.leaveType === 'sick' ? 'S' :
                           leave.leaveType === 'personal' ? 'P' :
                           leave.leaveType === 'maternity' ? 'M' :
                           leave.leaveType === 'paternity' ? 'PT' :
                           leave.leaveType === 'emergency' ? 'E' : 'L'}
                        </span>
                        <span className="truncate">{leave.staffName}</span>
                      </div>
                      <div className="text-[10px] opacity-90 ml-5">
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                      </div>
                    </div>
                  ))}

                  {/* Bookings */}
                  {visibleBookings.map((booking) => {
                    const needsReassignment = requiresReassignment(booking);
                    
                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "text-xs p-1.5 rounded cursor-pointer transition-all",
                          "hover:opacity-80 hover:shadow-sm",
                          "text-white border-l-2",
                          needsReassignment 
                            ? "bg-amber-400 border-amber-600 ring-2 ring-amber-300" 
                            : getStatusColor(booking)
                        )}
                        onClick={() => onBookingClick?.(booking)}
                        title={`${booking.clientName}\n${booking.startTime} - ${booking.endTime}\nCarer: ${booking.carerName}\nStatus: ${booking.status}${needsReassignment ? '\n⚠️ REASSIGNMENT REQUIRED' : ''}`}
                      >
                        {needsReassignment && (
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className="bg-white text-amber-700 rounded-sm px-1 py-0.5 text-[9px] font-bold flex items-center gap-0.5">
                              <AlertTriangle className="h-2 w-2" />
                              {getReassignmentBadgeText(booking.unavailability_request!.status)}
                            </span>
                          </div>
                        )}
                        <div className="font-semibold truncate">
                          {booking.clientName}
                        </div>
                        <div className="text-[10px] opacity-90">
                          {booking.startTime}-{booking.endTime}
                        </div>
                      </div>
                    );
                  })}

                  {/* Overflow indicator */}
                  {overflowCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowMoreBookings(day, dayBookings);
                      }}
                      className="text-[10px] text-primary hover:text-primary/80 font-medium px-1.5 py-1 cursor-pointer hover:underline transition-colors w-full text-left"
                    >
                      +{overflowCount} more
                    </button>
                  )}

                {/* Empty state - add booking button */}
                {dayBookings.length === 0 && dayLeave.length === 0 && !getHolidayForDay(day) && isCurrentMonth && (
                  <button
                    onClick={() => onCreateBooking?.(day, "08:00", undefined, undefined)}
                    className="w-full text-[10px] text-muted-foreground hover:text-primary px-1.5 py-1 rounded border border-dashed border-border hover:border-primary transition-colors opacity-0 hover:opacity-100"
                  >
                    + Add
                  </button>
                )}
              </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Bookings Dialog */}
      {selectedDay && (
        <DayBookingsDialog
          open={isDayDialogOpen}
          onOpenChange={setIsDayDialogOpen}
          date={selectedDay}
          bookings={getBookingsForDay(selectedDay)}
          onBookingClick={onBookingClick}
        />
      )}
    </div>
  );
};
