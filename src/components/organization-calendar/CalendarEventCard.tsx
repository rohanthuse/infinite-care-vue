import React from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Users, 
  Clock, 
  MapPin, 
  AlertCircle,
  Calendar,
  User,
  FileText,
  AlertTriangle,
  XCircle,
  Building2
} from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';
import { EventContextMenu } from './EventContextMenu';

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
  showTime?: boolean;
  onClick?: (event: CalendarEvent) => void;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (event: CalendarEvent) => void;
  onDuplicate?: (event: CalendarEvent) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({
  event,
  compact = false,
  showTime = true,
  onClick,
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };
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
    // Priority: Missed > Late > Normal type-based colors
    if (event.isMissed) {
      return 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/50 dark:text-red-100';
    }
    if (event.isLateStart) {
      return 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100';
    }
    
    const colors = {
      booking: 'border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100',
      meeting: 'border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-100',
      leave: 'border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-100',
      training: 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950/50 dark:text-green-100',
      agreement: 'border-yellow-500 bg-yellow-50 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-100'
    };
    return colors[type as keyof typeof colors] || 'border-border bg-card text-foreground';
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

  // Extract client name from event
  const getClientName = (): string => {
    const clientParticipant = event.participants?.find(p => p.role === 'client');
    if (clientParticipant) return clientParticipant.name;
    return event.title || 'Unknown Client';
  };

  // Extract all carer/staff names from event
  const getCarerNames = (): string[] => {
    const staffParticipants = event.participants?.filter(p => p.role === 'staff' || p.role === 'carer');
    if (!staffParticipants || staffParticipants.length === 0) return ['Not Assigned'];
    return staffParticipants.map(p => p.name);
  };

  // Extract branch admin names from event
  const getBranchAdminNames = (): string[] => {
    const adminParticipants = event.participants?.filter(p => p.role === 'branch_admin');
    if (!adminParticipants || adminParticipants.length === 0) return [];
    return adminParticipants.map(p => p.name);
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div
              className={`p-2 rounded-md border-l-4 ${getEventColor(event.type)} cursor-pointer hover:shadow-sm transition-shadow min-w-[200px] max-w-[300px]`}
              onClick={handleClick}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <EventIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate" title={getClientName()}>
                    {getClientName()}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {event.isMissed && (
                    <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                  )}
                  {event.isLateStart && !event.isMissed && (
                    <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                  )}
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(event.status)} flex-shrink-0`} />
                </div>
              </div>
              
              {showTime && (
                <div className="mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
                  </span>
                  {event.isLateStart && event.lateStartMinutes && event.lateStartMinutes > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                      (+{event.lateStartMinutes}m late)
                    </span>
                  )}
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
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm p-3 space-y-2">
            {/* Client */}
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">Client:</span> {getClientName()}
              </div>
            </div>
            
            {/* Carers */}
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-medium">Carer{getCarerNames().length > 1 ? 's' : ''}:</span>
                <div className="ml-0">
                  {getCarerNames().map((name, idx) => (
                    <div key={idx} className="text-muted-foreground">{name}</div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Branch Admins - only show if there are any */}
            {getBranchAdminNames().length > 0 && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium">Branch Admin{getBranchAdminNames().length > 1 ? 's' : ''}:</span>
                  <div className="ml-0">
                    {getBranchAdminNames().map((name, idx) => (
                      <div key={idx} className="text-muted-foreground">{name}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Time */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">
                {format(new Date(event.startTime), 'HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
              </span>
            </div>
            
            {/* Location */}
            {event.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{event.location}</span>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground pt-1 border-t border-border">Click to view details</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={`${getEventColor(event.type)} cursor-pointer hover:shadow-md transition-shadow`} onClick={handleClick}>
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
            {/* Late Start Badge with Tooltip */}
            {event.isLateStart && !event.isMissed && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline"
                      className="text-xs bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 cursor-help"
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Late ({event.lateStartMinutes}m)
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Late Arrival</p>
                    <p className="text-sm text-muted-foreground">
                      {event.lateArrivalReason || 'No reason specified'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Missed Badge */}
            {event.isMissed && (
              <Badge 
                variant="outline"
                className="text-xs bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700"
              >
                <XCircle className="h-3 w-3 mr-1" />
                Missed
              </Badge>
            )}
            <Badge 
              variant="secondary"
              className={`text-xs text-white ${getStatusColor(event.status)}`}
            >
              {event.status}
            </Badge>
            {event.priority === 'high' && (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <EventContextMenu
              event={event}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          </div>
        </div>

        {/* Time - Planned */}
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {format(new Date(event.startTime), 'MMM d, HH:mm')} - {format(new Date(event.endTime), 'HH:mm')}
          </span>
        </div>
        
        {/* Actual Start Time - if late */}
        {event.isLateStart && event.actualStartTime && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border-l-2 border-amber-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="text-sm">
              <span className="text-muted-foreground">Actual arrival: </span>
              <span className="font-medium text-amber-700 dark:text-amber-400">
                {format(new Date(event.actualStartTime), 'HH:mm')}
              </span>
              <span className="text-amber-600 dark:text-amber-400 ml-1">
                ({event.lateStartMinutes}m late)
              </span>
            </div>
          </div>
        )}

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