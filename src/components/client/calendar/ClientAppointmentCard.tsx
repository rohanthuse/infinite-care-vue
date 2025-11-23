import React from 'react';
import { Clock, MapPin, User, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getAppointmentStatusColor, getEventTypeBadgeColor } from '@/utils/clientCalendarHelpers';
import { format } from 'date-fns';

interface ClientAppointmentCardProps {
  appointment: {
    id: string;
    appointment_type: string;
    provider_name: string;
    appointment_date: string;
    appointment_time: string;
    location: string;
    status: string;
    _source?: 'booking' | 'external';
    _booking_data?: any;
  };
  compact?: boolean;
  showTime?: boolean;
  onClick?: (appointment: any) => void;
}

export const ClientAppointmentCard: React.FC<ClientAppointmentCardProps> = ({
  appointment,
  compact = false,
  showTime = true,
  onClick
}) => {
  const startDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
  const sourceBadge = appointment._source === 'booking' ? 'Care Service' : 'External';

  if (compact) {
    return (
      <div
        className="text-xs p-2 rounded-lg border border-border bg-card hover:bg-accent cursor-pointer transition-colors"
        onClick={() => onClick?.(appointment)}
      >
        <div className="font-medium text-foreground truncate">{appointment.appointment_type}</div>
        {showTime && (
          <div className="text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" />
            {format(startDateTime, 'HH:mm')}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(appointment)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">{appointment.appointment_type}</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{appointment.provider_name}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge className={getAppointmentStatusColor(appointment.status)}>
              {appointment.status}
            </Badge>
            <Badge variant="outline" className={getEventTypeBadgeColor(appointment._source || 'external')}>
              {sourceBadge}
            </Badge>
          </div>
        </div>

        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(startDateTime, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{format(startDateTime, 'HH:mm')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{appointment.location}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
