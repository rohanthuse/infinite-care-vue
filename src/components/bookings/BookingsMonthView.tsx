import React from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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
}

export interface Client {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
}

export interface Carer {
  id: string;
  name: string;
  initials: string;
  bookingCount: number;
  bookings?: Booking[];
}

interface BookingsMonthViewProps {
  date: Date;
  bookings: Booking[];
  clients: Client[];
  carers: Carer[];
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
  isLoading = false,
  onBookingClick,
  onCreateBooking,
}) => {
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

  // Get status color for booking
  const getStatusColor = (status: Booking["status"]): string => {
    const colors = {
      assigned: "bg-blue-500 border-blue-600",
      unassigned: "bg-gray-400 border-gray-500",
      done: "bg-green-500 border-green-600",
      "in-progress": "bg-amber-500 border-amber-600",
      cancelled: "bg-red-500 border-red-600",
      departed: "bg-purple-500 border-purple-600",
      suspended: "bg-orange-500 border-orange-600",
    };
    return colors[status] || "bg-gray-500 border-gray-600";
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
                  {dayBookings.length > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {dayBookings.length}
                    </span>
                  )}
                </div>

                {/* Bookings list */}
                <div className="space-y-1">
                  {visibleBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={cn(
                        "text-xs p-1.5 rounded cursor-pointer transition-all",
                        "hover:opacity-80 hover:shadow-sm",
                        "text-white border-l-2",
                        getStatusColor(booking.status)
                      )}
                      onClick={() => onBookingClick?.(booking)}
                      title={`${booking.clientName}\n${booking.startTime} - ${booking.endTime}\nCarer: ${booking.carerName}\nStatus: ${booking.status}`}
                    >
                      <div className="font-semibold truncate">
                        {booking.clientName}
                      </div>
                      <div className="text-[10px] opacity-90">
                        {booking.startTime}-{booking.endTime}
                      </div>
                    </div>
                  ))}

                  {/* Overflow indicator */}
                  {overflowCount > 0 && (
                    <div className="text-[10px] text-muted-foreground font-medium px-1.5 py-1">
                      +{overflowCount} more
                    </div>
                  )}

                  {/* Empty state - add booking button */}
                  {dayBookings.length === 0 && isCurrentMonth && (
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
    </div>
  );
};
