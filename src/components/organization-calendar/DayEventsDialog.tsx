import React from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarEvent } from '@/types/calendar';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface DayEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export const DayEventsDialog: React.FC<DayEventsDialogProps> = ({
  open,
  onOpenChange,
  date,
  events,
  onEventClick
}) => {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  const getEventTypeColor = (type: string) => {
    const colors = {
      booking: 'bg-blue-500 text-white hover:bg-blue-500/80',
      meeting: 'bg-purple-500 text-white hover:bg-purple-500/80',
      leave: 'bg-teal-500 text-white hover:bg-teal-500/80',
      training: 'bg-green-500 text-white hover:bg-green-500/80',
      agreement: 'bg-yellow-500 text-white hover:bg-yellow-500/80'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Events on {format(date, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            {events.length} event{events.length !== 1 ? 's' : ''} scheduled for this day
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable event list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {sortedEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled for this day</p>
            </div>
          ) : (
            sortedEvents.map((event, index) => (
              <Card 
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  onEventClick(event);
                  onOpenChange(false); // Close day dialog when opening event detail
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {/* Event Type Badge */}
                      <Badge className={getEventTypeColor(event.type)}>
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                      
                      {/* Event Title */}
                      <h4 className="font-semibold text-base mt-2 text-foreground">
                        {event.title}
                      </h4>
                      
                      {/* Time and Location */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {format(new Date(event.startTime), 'HH:mm')} - 
                            {format(new Date(event.endTime), 'HH:mm')}
                          </span>
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Participants */}
                      {event.participants && event.participants.length > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.participants.map(p => p.name).join(', ')}
                          </span>
                        </div>
                      )}
                      
                      {/* Branch */}
                      <div className="text-xs text-muted-foreground mt-1">
                        {event.branchName}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <Badge variant={getStatusVariant(event.status)}>
                      {event.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
