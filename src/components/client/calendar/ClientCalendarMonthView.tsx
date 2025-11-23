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
import { getEventTypeColor } from '@/utils/clientCalendarHelpers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ClientCalendarMonthViewProps {
  date: Date;
  events?: CalendarEvent[];
  isLoading?: boolean;
  onEventClick?: (event: CalendarEvent) => void;
}

export const ClientCalendarMonthView: React.FC<ClientCalendarMonthViewProps> = ({
  date,
  events = [],
  isLoading = false,
  onEventClick
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

  const handleShowMoreEvents = (day: Date, dayEvents: CalendarEvent[]) => {
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
          {events.length} appointments this month
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
                    <Badge variant="secondary" className="text-xs">
                      {dayEvents.length}
                    </Badge>
                  )}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event, eventIndex) => (
                    <div
                      key={eventIndex}
                      className="text-xs p-1 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: getEventTypeColor(event.type)
                      }}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Day Events Dialog */}
      {selectedDayEvents && (
        <Dialog open={dayEventsDialogOpen} onOpenChange={setDayEventsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Appointments for {format(selectedDayEvents.date, 'MMMM d, yyyy')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {selectedDayEvents.events.map((event, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  style={{
                    borderLeft: `4px solid ${getEventTypeColor(event.type)}`
                  }}
                  onClick={() => {
                    onEventClick?.(event);
                    setDayEventsDialogOpen(false);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{event.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.participants[0]?.name}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {event.type === 'booking' ? 'Care Service' : 'External'}
                      </Badge>
                    </div>
                    {event.location && (
                      <p className="text-sm text-muted-foreground mt-2">
                        📍 {event.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
