
import React, { useState } from "react";
import { Calendar, Clock, User, MapPin, Phone, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isTomorrow, isYesterday } from "date-fns";
import { useCarerDashboard } from "@/hooks/useCarerDashboard";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useLeaveStatus } from "@/hooks/useLeaveManagement";
import { Skeleton } from "@/components/ui/skeleton";

const CarerSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week, day
  const { user } = useCarerAuth();
  
  // Use real booking data instead of mock data
  const { data: allBookings = [], isLoading } = useCarerBookings(user?.id || '');
  
  // Filter bookings for current week
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  
  // Get staff branch ID from the bookings (assuming all bookings belong to same branch)
  const staffBranchId = allBookings[0]?.branch_id;
  
  // Get leave status for the week
  const { data: leaveStatus } = useLeaveStatus(
    staffBranchId || '',
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );
  
  const weekBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.start_time);
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'assigned':
      case 'scheduled':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEEE, MMM dd");
  };

  const generateWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayString = format(day, 'yyyy-MM-dd');
      const dayBookings = weekBookings.filter(booking => 
        format(new Date(booking.start_time), 'yyyy-MM-dd') === dayString
      );
      
      // Check if user is on leave this day
      const isOnLeave = leaveStatus?.staffLeave.some(leave => 
        leave.staff_id === user?.id &&
        dayString >= leave.start_date && 
        dayString <= leave.end_date
      );
      
      // Check if it's an annual leave day
      const isAnnualLeave = leaveStatus?.annualLeave.some(leave => 
        leave.leave_date === dayString
      );
      
      days.push({
        date: day,
        bookings: dayBookings,
        isToday: isToday(day),
        isOnLeave,
        isAnnualLeave
      });
    }
    return days;
  };

  const weekDays = generateWeekDays();

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subDays(currentDate, 7));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">My Schedule</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week View</SelectItem>
              <SelectItem value="day">Day View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <h2 className="text-lg font-medium">
          {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
        </h2>
      </div>

      {/* Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <Card key={index} className={`
              ${day.isToday ? 'ring-2 ring-blue-500' : ''}
              ${day.isOnLeave ? 'bg-red-50 border-red-200' : ''}
              ${day.isAnnualLeave ? 'bg-orange-50 border-orange-200' : ''}
            `}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span>{format(day.date, 'EEE')}</span>
                  {day.isOnLeave && (
                    <Badge className="bg-red-100 text-red-700 text-xs">Leave</Badge>
                  )}
                  {day.isAnnualLeave && (
                    <Badge className="bg-orange-100 text-orange-700 text-xs">Holiday</Badge>
                  )}
                </CardTitle>
                <CardDescription className={`text-xs ${day.isToday ? 'text-blue-600 font-medium' : ''}`}>
                  {format(day.date, 'MMM dd')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {day.bookings.length > 0 ? (
                  day.bookings.map((booking) => (
                    <div key={booking.id} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="font-medium">{format(new Date(booking.start_time), 'HH:mm')}</div>
                      <div className="text-gray-600 truncate">{booking.client_name}</div>
                      <div className="text-gray-500 truncate">{booking.service_name}</div>
                      <Badge className={`${getStatusColor(booking.status)} text-xs mt-1`}>
                        {booking.status === 'assigned' ? 'Scheduled' : booking.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 py-4 text-center">
                    No appointments
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {formatAppointmentDate(currentDate.toISOString())}
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(subDays(currentDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentDate(addDays(currentDate, 1))}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {weekBookings
            .filter(booking => 
              format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
            )
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">
                            {format(new Date(booking.start_time), 'HH:mm')} - {format(new Date(booking.end_time), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{booking.client_name}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Service:</strong> {booking.service_name}
                      </div>
                      
                      {booking.revenue && (
                        <div className="text-sm text-gray-600">
                          <strong>Value:</strong> £{booking.revenue}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status === 'assigned' ? 'Scheduled' : booking.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          
          {weekBookings.filter(booking => 
            format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
          ).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                <p className="text-gray-500">You have a free day!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Overall Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Week Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{weekBookings.length}</div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {weekBookings.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {weekBookings.filter(b => b.status === 'assigned' || b.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                £{weekBookings.reduce((sum, booking) => sum + (booking.revenue || 0), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Week Revenue</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CarerSchedule;
