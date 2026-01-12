
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Clock } from "lucide-react";
import { Client, Carer, Booking } from "./BookingTimeGrid";
import { formatHoursToReadable } from "@/lib/utils";

interface EntityListProps {
  type: "client" | "carer";
  entities: Client[] | Carer[];
  selectedEntityId: string | null;
  onSelect: (id: string) => void;
  currentDate?: Date;
  viewType?: "daily" | "weekly" | "monthly";
  weekDates?: Date[];
}

export const EntityList: React.FC<EntityListProps> = ({
  type,
  entities,
  selectedEntityId,
  onSelect,
  currentDate,
  viewType = "daily",
  weekDates = [],
}) => {
  const filterBookingsByDateRange = (bookings?: Booking[]) => {
    if (!bookings || bookings.length === 0) return [];
    if (!currentDate) return bookings;

    return bookings.filter(booking => {
      if (!booking.date) return false;
      
      try {
        const bookingDate = new Date(booking.date);
        if (isNaN(bookingDate.getTime())) return false;
        
        if (viewType === "daily") {
          return bookingDate.toDateString() === currentDate.toDateString();
        } else if (viewType === "weekly") {
          return weekDates.some(weekDate => 
            bookingDate.toDateString() === weekDate.toDateString()
          );
        } else if (viewType === "monthly") {
          return bookingDate.getMonth() === currentDate.getMonth() && 
                 bookingDate.getFullYear() === currentDate.getFullYear();
        }
        
        return false;
      } catch (error) {
        console.error("Error filtering booking date:", booking.date, error);
        return false;
      }
    });
  };

  const calculateTotalHours = (bookings?: Booking[]) => {
    const filteredBookings = filterBookingsByDateRange(bookings);
    if (filteredBookings.length === 0) return 0;
    
    // Group bookings by time slot to identify multi-carer scenarios
    const groupedBySlot = new Map<string, Booking[]>();
    
    filteredBookings.forEach(booking => {
      if (booking.status !== "cancelled") {
        // Group by date+time to identify same visit with multiple carers
        const key = `${booking.date}-${booking.startTime}-${booking.endTime}`;
        if (!groupedBySlot.has(key)) {
          groupedBySlot.set(key, []);
        }
        groupedBySlot.get(key)!.push(booking);
      }
    });
    
    let totalMinutes = 0;
    
    groupedBySlot.forEach((bookingsInSlot) => {
      const booking = bookingsInSlot[0];
      const startParts = booking.startTime.split(':').map(Number);
      const endParts = booking.endTime.split(':').map(Number);
      
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      const duration = endMinutes - startMinutes;
      const carerCount = bookingsInSlot.length; // Each booking record = 1 carer
      
      totalMinutes += duration * carerCount;
    });
    
    return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place
  };
  
  const formatHourText = (hours: number) => {
    return formatHoursToReadable(hours);
  };
  
  const getBookingsByStatus = (bookings?: Booking[]) => {
    const filteredBookings = filterBookingsByDateRange(bookings);
    if (filteredBookings.length === 0) return {};
    
    // Group by status AND time slot to account for multiple carers
    const groupedByStatusAndSlot = new Map<string, Booking[]>();
    
    filteredBookings.forEach(booking => {
      const key = `${booking.status}-${booking.date}-${booking.startTime}-${booking.endTime}`;
      if (!groupedByStatusAndSlot.has(key)) {
        groupedByStatusAndSlot.set(key, []);
      }
      groupedByStatusAndSlot.get(key)!.push(booking);
    });
    
    const result: Record<string, { count: number, hours: number }> = {};
    
    groupedByStatusAndSlot.forEach((bookingsInSlot) => {
      const status = bookingsInSlot[0].status;
      
      if (!result[status]) {
        result[status] = { count: 0, hours: 0 };
      }
      
      const booking = bookingsInSlot[0];
      const startParts = booking.startTime.split(':').map(Number);
      const endParts = booking.endTime.split(':').map(Number);
      
      const startMinutes = startParts[0] * 60 + startParts[1];
      const endMinutes = endParts[0] * 60 + endParts[1];
      
      const hours = (endMinutes - startMinutes) / 60;
      const carerCount = bookingsInSlot.length; // Each booking record = 1 carer
      
      result[status].count += 1; // Count unique visits
      result[status].hours += hours * carerCount; // Hours = duration × carers
    });
    
    return result;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-2 bg-muted border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          {type === "client" ? "Clients" : "Carers"}
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {entities.map((entity) => {
            // Calculate filtered bookings and hours for current view
            const filteredBookings = filterBookingsByDateRange('bookings' in entity ? entity.bookings : undefined);
            const filteredBookingCount = filteredBookings.length;
            const totalHours = calculateTotalHours('bookings' in entity ? entity.bookings : undefined);
            const bookingsByStatus = getBookingsByStatus('bookings' in entity ? entity.bookings : undefined);
            
            return (
              <div
                key={entity.id}
                className={`p-2 rounded-md cursor-pointer transition-colors
                  ${
                    entity.id === selectedEntityId
                      ? type === "client"
                        ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                        : "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                      : "bg-card hover:bg-muted"
                  } 
                  border`}
                onClick={() => onSelect(entity.id)}
              >
                <div className="flex items-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium mr-2 
                      ${
                        type === "client"
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                          : "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400"
                      }`}
                  >
                    {entity.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate text-foreground">{entity.name}</div>
                    {type === "client" && 'pin_code' in entity && (entity as any).pin_code && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-950/30 px-1 py-0.5 rounded w-fit mt-0.5">
                        {(entity as any).pin_code}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                <Badge
                  variant="custom"
                  className={`${
                    type === "client"
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                  } text-xs`}
                >
                        {filteredBookingCount} booking{filteredBookingCount !== 1 ? "s" : ""}
                      </Badge>
                      
                      {totalHours > 0 && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                type === "client" 
                                  ? "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800" 
                                  : "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                              } cursor-pointer flex items-center gap-1`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelect(entity.id);
                              }}
                            >
                              <Clock className="h-3 w-3" />
                              {formatHourText(totalHours)}
                            </Badge>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-60 p-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-semibold text-foreground">{entity.name}</h4>
                              <div className="text-xs text-muted-foreground">Total: {formatHoursToReadable(totalHours)}</div>
                              
                              {Object.entries(bookingsByStatus).length > 0 && (
                                <div className="space-y-1 pt-2">
                                  <div className="text-xs font-medium text-foreground">Hours by status:</div>
                                  {Object.entries(bookingsByStatus).map(([status, data]) => (
                                    <div key={status} className="flex justify-between text-xs text-muted-foreground">
                                      <span className="capitalize">{status}:</span>
                                      <span>{formatHoursToReadable(data.hours)} ({data.count})</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
