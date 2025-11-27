import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEvent } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getEventTypeColor, getEventColorByRequestStatus } from '@/utils/clientCalendarHelpers';

interface ClientCalendarWeekViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export const ClientCalendarWeekView: React.FC<ClientCalendarWeekViewProps> = ({
  date,
  events = [],
  isLoading = false,
  onEventClick
}) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  
  // Generate time slots for full 24 hours
  const timeSlots = Array.from({ length: 24 }, (_, index) => index);

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      if (!isSameDay(eventStart, day)) return false;
      
      const eventStartHour = eventStart.getHours();
      const eventEndHour = eventEnd.getHours();
      
      return eventStartHour <= hour && eventEndHour > hour;
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[700px] sm:h-[750px] lg:h-[800px]">
      {/* Header with days */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[70px_repeat(7,1fr)] lg:grid-cols-[80px_repeat(7,1fr)] border-b border-border">
        <div className="p-4"></div>
        {weekDays.map((day, index) => (
          <div key={index} className="p-4 text-center border-l border-border">
            <div className="font-medium text-muted-foreground text-sm">
              {format(day, 'EEE')}
            </div>
            <div className={`text-xl font-bold mt-1 ${
              isToday(day) ? 'text-primary' : 'text-foreground'
            }`}>
              {format(day, 'd')}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {events.filter(e => isSameDay(new Date(e.startTime), day)).length} events
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] sm:grid-cols-[70px_repeat(7,1fr)] lg:grid-cols-[80px_repeat(7,1fr)]">
          {timeSlots.map((hour, hourIndex) => (
            <React.Fragment key={hourIndex}>
              {/* Time Label */}
              <div className="p-2 text-right border-r border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'HH:mm')}
                </span>
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[40px] sm:min-h-[50px] border-l border-t border-border p-1"
                  >
                    <div className="space-y-1">
                      {dayEvents.map((event, eventIndex) => (
                        <div
                          key={`${event.id}-${eventIndex}`}
                          className="text-xs p-2 rounded cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: getEventColorByRequestStatus(
                              event._rawAppointmentData?.cancellation_request_status,
                              event._rawAppointmentData?.reschedule_request_status,
                              getEventTypeColor(event.type)
                            ),
                            color: 'white'
                          }}
                          onClick={() => onEventClick?.(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-xs opacity-90">
                            {format(new Date(event.startTime), 'HH:mm')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
