import React from 'react';
import { format, addMinutes, startOfDay, isSameHour } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarEventCard } from './CalendarEventCard';
import { CalendarEvent } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { AddEventPopover } from './AddEventPopover';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CalendarDayViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onDuplicateEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (date?: Date, timeSlot?: Date, eventType?: string) => void;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  date,
  events = [],
  isLoading = false,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onAddEvent
}) => {
  // Generate time slots from 7 AM to 10 PM (15 hours * 2 = 30 slots of 30 minutes)
  const timeSlots = Array.from({ length: 30 }, (_, index) => {
    const startTime = addMinutes(startOfDay(date), (7 * 60) + (index * 30));
    return startTime;
  });

  const getEventsForTimeSlot = (timeSlot: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      const eventEnd = new Date(event.endTime);
      
      // Check if the event overlaps with this time slot
      const slotEnd = addMinutes(timeSlot, 30);
      return (eventStart < slotEnd && eventEnd > timeSlot);
    });
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Check for events outside visible time range (7 AM - 10 PM)
  const eventsOutsideRange = events.filter(event => {
    const hour = new Date(event.startTime).getHours();
    return hour < 7 || hour >= 22;
  });

  return (
    <div className="flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''} scheduled
          </p>
          {eventsOutsideRange.length > 0 && (
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-900 dark:from-yellow-900/40 dark:to-yellow-800/40 dark:text-yellow-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              {eventsOutsideRange.length} outside 7 AM-10 PM
            </Badge>
          )}
        </div>
      </div>

      {/* Time Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-[80px_1fr] gap-0">
          {timeSlots.map((timeSlot, index) => {
            const timeSlotEvents = getEventsForTimeSlot(timeSlot);
            const isOnTheHour = timeSlot.getMinutes() === 0;
            
            return (
              <div key={index} className="contents">
                {/* Time Label */}
                <div className={`p-2 text-right border-r border-border ${isOnTheHour ? 'border-t' : ''}`}>
                  {isOnTheHour && (
                    <span className="text-sm text-muted-foreground">
                      {format(timeSlot, 'HH:mm')}
                    </span>
                  )}
                </div>

                {/* Event Area */}
                <div className={`min-h-[60px] border-border ${isOnTheHour ? 'border-t' : 'border-t border-dashed'} relative group`}>
                  <div className="p-1 flex flex-row gap-1 flex-wrap items-start">
                    {timeSlotEvents.map((event, eventIndex) => (
                      <CalendarEventCard
                        key={`${event.id}-${eventIndex}`}
                        event={event}
                        compact
                        onClick={onEventClick}
                        onEdit={onEditEvent}
                        onDelete={onDeleteEvent}
                        onDuplicate={onDuplicateEvent}
                      />
                    ))}
                    
                    {/* Add Event button - always visible on hover */}
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <AddEventPopover
                        date={date}
                        timeSlot={timeSlot}
                        onEventTypeSelect={(eventType) => onAddEvent?.(date, timeSlot, eventType)}
                      >
                        <button className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded border border-dashed border-border hover:border-primary min-w-[100px]">
                          + Add Event
                        </button>
                      </AddEventPopover>
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