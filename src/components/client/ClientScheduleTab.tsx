import React from 'react';
import { Clock, Calendar, MapPin, User, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useClientSchedule } from '@/hooks/useClientSchedule';

interface ClientScheduleTabProps {
  clientId?: string;
}

export const ClientScheduleTab: React.FC<ClientScheduleTabProps> = ({ clientId }) => {
  const { data: scheduleData, isLoading } = useClientSchedule(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading schedule...</span>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No schedule data available</p>
      </div>
    );
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-primary" />
              Care Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">{scheduleData.carePattern}</p>
            <p className="text-sm text-muted-foreground">{scheduleData.totalHoursPerWeek} hours/week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-emerald-600" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleData.nextAppointment ? (
              <div>
                <p className="text-lg font-semibold text-foreground">{scheduleData.nextAppointment.date}</p>
                <p className="text-sm text-muted-foreground">{scheduleData.nextAppointment.time}</p>
                <p className="text-xs text-muted-foreground mt-1">with {scheduleData.nextAppointment.carer}</p>
                <p className="text-xs text-primary mt-1">{scheduleData.nextAppointment.service}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No upcoming appointments</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-purple-600" />
              Care Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="custom" className={getStatusColor(scheduleData.careStatus)}>
              {scheduleData.careStatus}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Current care plan status</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Care Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Weekly Care Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
              <div key={day.key} className="text-center">
                <h4 className="font-semibold text-foreground mb-2">{day.label}</h4>
                <div className="space-y-1">
                  {scheduleData.careHours[day.key as keyof typeof scheduleData.careHours].length > 0 ? (
                    scheduleData.careHours[day.key as keyof typeof scheduleData.careHours].map((timeSlot, index) => (
                      <div key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {timeSlot}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-muted-foreground px-2 py-1">
                      No care scheduled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};