import React, { useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { AddEventPopover } from './AddEventPopover';
import { DayEventsDialog } from './DayEventsDialog';

interface CalendarMonthViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
  onEditEvent?: (event: CalendarEvent) => void;
  onDeleteEvent?: (event: CalendarEvent) => void;
  onDuplicateEvent?: (event: CalendarEvent) => void;
  onAddEvent?: (date?: Date, timeSlot?: Date, eventType?: string) => void;
}

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  date,
  events = [],
  isLoading = false,
  onEventClick,
  onEditEvent,
  onDeleteEvent,
  onDuplicateEvent,
  onAddEvent
}) => {
  const [dayEventsDialogOpen, setDayEventsDialogOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    date: Date;
    events: CalendarEvent[];
  } | null>(null);

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.startTime);
      return isSameDay(eventStart, day);
    });
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      booking: 'bg-blue-500',
      meeting: 'bg-purple-500',
      leave: 'bg-teal-500',
      training: 'bg-green-500',
      agreement: 'bg-yellow-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const handleShowMoreEvents = (day: Date, dayEvents: CalendarEvent[]) => {
    console.log('[CalendarMonthView] Opening day events dialog:', {
      date: format(day, 'yyyy-MM-dd'),
      eventCount: dayEvents.length
    });
    
    setSelectedDayEvents({ date: day, events: dayEvents });
    setDayEventsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">
          {format(date, 'MMMM yyyy')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {events.length} events this month
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Week Day Headers */}
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, date);
          const isDayToday = isToday(day);
          
          return (
            <Card 
              key={index} 
              className={`min-h-[120px] ${
                !isCurrentMonth ? 'opacity-50' : ''
              } ${isDayToday ? 'border-primary' : ''}`}
            >
              <CardContent className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${
                    isDayToday ? 'text-primary' : 'text-foreground'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <Badge variant="secondary" className="text-xs dark:bg-secondary dark:text-secondary-foreground">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className={`text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity ${getEventTypeColor(event.type)}`}
                      title={event.title}
                      onClick={() => onEventClick?.(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="opacity-80">
                        {format(new Date(event.startTime), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <button
                      className="text-xs text-muted-foreground hover:text-primary text-center py-1 w-full rounded hover:bg-accent transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowMoreEvents(day, dayEvents);
                      }}
                      title="Click to view all events"
                    >
                      +{dayEvents.length - 3} more
                    </button>
                  )}
                </div>

                {/* Add Event Button */}
                {dayEvents.length === 0 && isCurrentMonth && (
                  <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                    <AddEventPopover
                      date={day}
                      onEventTypeSelect={(eventType) => onAddEvent?.(day, undefined, eventType)}
                    >
                      <button className="text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded border border-dashed border-border hover:border-primary">
                        + Add Event
                      </button>
                    </AddEventPopover>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Day Events Dialog */}
      {selectedDayEvents && (
        <DayEventsDialog
          open={dayEventsDialogOpen}
          onOpenChange={setDayEventsDialogOpen}
          date={selectedDayEvents.date}
          events={selectedDayEvents.events}
          onEventClick={(event) => {
            onEventClick?.(event);
          }}
        />
      )}
    </div>
  );
};