import React from 'react';
import { format, addDays, startOfWeek, isSameDay, addMinutes, startOfDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarEvent } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarWeekViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
}

export const CalendarWeekView: React.FC<CalendarWeekViewProps> = ({
  date,
  events = [],
  isLoading = false
}) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  
  // Generate time slots from 7 AM to 10 PM
  const timeSlots = Array.from({ length: 15 }, (_, index) => {
    return 7 + index; // Hours from 7 to 21 (7 AM to 9 PM)
  });

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Check if event is on this day and overlaps with this hour
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
    <div className="flex flex-col h-[600px]">
      {/* Header with days */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border">
        <div className="p-4"></div>
        {weekDays.map((day, index) => (
          <div key={index} className="p-4 text-center border-l border-border">
            <div className="font-medium text-foreground">
              {format(day, 'EEE')}
            </div>
            <div className={`text-2xl font-bold mt-1 ${
              isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'
            }`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[80px_repeat(7,1fr)]">
          {timeSlots.map((hour, hourIndex) => (
            <React.Fragment key={hourIndex}>
              {/* Time Label */}
              <div className="p-2 text-right border-r border-t border-border">
                <span className="text-sm text-muted-foreground">
                  {format(new Date().setHours(hour, 0, 0, 0), 'h:mm a')}
                </span>
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                
                return (
                  <div
                    key={dayIndex}
                    className="min-h-[80px] border-l border-t border-border relative group"
                  >
                    {dayEvents.length > 0 ? (
                      <div className="p-1 space-y-1">
                        {dayEvents.map((event, eventIndex) => (
                          <CalendarEventCard
                            key={`${event.id}-${eventIndex}`}
                            event={event}
                            compact
                            showTime={false}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded border border-dashed border-border hover:border-primary">
                          +
                        </button>
                      </div>
                    )}
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