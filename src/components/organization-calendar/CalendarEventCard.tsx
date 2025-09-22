import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  compact = false,
  showTime = true
}) => {
  const getEventIcon = (type: string) => {
    const icons = {
      booking: Calendar,
      meeting: Users,
      leave: User,
      training: FileText,
      agreement: FileText
    };
    return icons[type as keyof typeof icons] || Calendar;
  };

  const getEventColor = (type: string) => {
    const colors = {
      booking: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      meeting: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      leave: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      training: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      agreement: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
    };
    return colors[type as keyof typeof colors] || 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-500',
      'in-progress': 'bg-green-500',
      completed: 'bg-gray-500',
      cancelled: 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const EventIcon = getEventIcon(event.type);

  if (compact) {
    return (
      <div
        className={`p-2 rounded-md border-l-4 ${getEventColor(event.type)} cursor-pointer hover:shadow-sm transition-shadow`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <EventIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">
              {event.title}
            </span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)} flex-shrink-0`} />
        </div>
        
        {showTime && (
          <div className="mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
            </span>
          </div>
        )}
        
        {event.participants && event.participants.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Users className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`${getEventColor(event.type)} cursor-pointer hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <EventIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <h4 className="font-medium text-foreground">{event.title}</h4>
              <p className="text-sm text-muted-foreground capitalize">{event.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              className={`text-xs text-white ${getStatusColor(event.status)}`}
            >
              {event.status}
            </Badge>
            {event.priority === 'high' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {format(new Date(event.startTime), 'MMM d, HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{event.location}</span>
          </div>
        )}

        {/* Participants */}
        {event.participants && event.participants.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {event.participants.slice(0, 3).map((participant, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {participant.name}
                </Badge>
              ))}
              {event.participants.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{event.participants.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Branch */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground">{event.branchName}</span>
        </div>

        {/* Conflicts */}
        {event.conflictsWith && event.conflictsWith.length > 0 && (
          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-4 border-red-500">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                Conflict with {event.conflictsWith.length} other event{event.conflictsWith.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};