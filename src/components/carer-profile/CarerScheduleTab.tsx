
import React from 'react';
import { Clock, Calendar, MapPin, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCarerSchedule } from '@/hooks/useCarerSchedule';

interface CarerScheduleTabProps {
  carerId: string;
}

export const CarerScheduleTab: React.FC<CarerScheduleTabProps> = ({ carerId }) => {
  const { data: scheduleData, isLoading } = useCarerSchedule(carerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-500">Loading schedule...</span>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="text-center py-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No schedule data available</p>
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

  return (
    <div className="space-y-6">
      {/* Schedule Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-600" />
              Working Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-900">{scheduleData.workingPattern}</p>
            <p className="text-sm text-gray-600">{scheduleData.totalHoursPerWeek} hours/week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-600" />
              Next Shift
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleData.nextShift ? (
              <div>
                <p className="text-lg font-semibold text-gray-900">{scheduleData.nextShift.date}</p>
                <p className="text-sm text-gray-600">{scheduleData.nextShift.time}</p>
                <p className="text-xs text-gray-500 mt-1">with {scheduleData.nextShift.client}</p>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming shifts</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-purple-600" />
              Availability Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Available
            </Badge>
            <p className="text-xs text-gray-500 mt-2">Current week availability</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
              <div key={day.key} className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">{day.label}</h4>
                <div className="space-y-1">
                  {scheduleData.availableHours[day.key as keyof typeof scheduleData.availableHours].length > 0 ? (
                    scheduleData.availableHours[day.key as keyof typeof scheduleData.availableHours].map((timeSlot, index) => (
                      <div key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {timeSlot}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 px-2 py-1">
                      Not available
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
