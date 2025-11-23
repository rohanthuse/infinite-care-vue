import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEvent } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { getEventTypeColor } from '@/utils/clientCalendarHelpers';

interface ClientCalendarDayViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export const ClientCalendarDayView: React.FC<ClientCalendarDayViewProps> = ({
  date,
  events = [],
  isLoading = false,
  onEventClick
}) => {
  // Generate time slots from 7 AM to 10 PM (30-minute intervals)
  const timeSlots = Array.from({ length: 30 }, (_, index) => {
    const hour = Math.floor(index / 2) + 7;
    const minute = (index % 2) * 30;
    const slotDate = new Date(date);
    slotDate.setHours(hour, minute, 0, 0);
    return slotDate;
  });

  const getEventsForTimeSlot = (timeSlot: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      const slotEnd = new Date(timeSlot.getTime() + 30 * 60 * 1000);
      
      if (!isSameDay(eventStart, date)) return false;
      
      return (eventStart < slotEnd && eventEnd > timeSlot);
    });
  };

  const eventsOutsideTimeRange = events.filter(event => {
    const eventStart = new Date(event.startTime);
    if (!isSameDay(eventStart, date)) return false;
    
    const hour = eventStart.getHours();
    return hour < 7 || hour >= 22;
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {events.filter(e => isSameDay(new Date(e.startTime), date)).length} appointments scheduled
            </p>
          </div>
          {eventsOutsideTimeRange.length > 0 && (
            <Badge variant="secondary">
              {eventsOutsideTimeRange.length} outside view
            </Badge>
          )}
        </div>
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[100px_1fr]">
          {timeSlots.map((timeSlot, index) => {
            const slotEvents = getEventsForTimeSlot(timeSlot);
            
            return (
              <React.Fragment key={index}>
                {/* Time Label */}
                <div className="p-3 text-right border-r border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    {format(timeSlot, 'HH:mm')}
                  </span>
                </div>

                {/* Event Area */}
                <div className="min-h-[60px] border-t border-border p-2 relative">
                  <div className="space-y-1">
                    {slotEvents.map((event, eventIndex) => (
                      <Card
                        key={`${event.id}-${eventIndex}`}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        style={{
                          borderLeft: `4px solid ${getEventTypeColor(event.type)}`
                        }}
                        onClick={() => onEventClick?.(event)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground text-sm">
                                {event.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.participants[0]?.name}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {event.type === 'booking' ? 'Care' : 'External'}
                            </Badge>
                          </div>
                          {event.location && (
                            <p className="text-xs text-muted-foreground mt-2">
                              📍 {event.location}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};
