
import React, { useState, useMemo } from "react";
import { Calendar, Clock, User, MapPin, Phone, Filter, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isTomorrow, isYesterday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { useCarerDashboard } from "@/hooks/useCarerDashboard";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useLeaveStatus } from "@/hooks/useLeaveManagement";
import { Skeleton } from "@/components/ui/skeleton";
import { CarerAppointmentDetailDialog } from "@/components/carer/CarerAppointmentDetailDialog";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";

const CarerSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week, day, month
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const { user } = useCarerAuth();
  const { createCarerPath } = useCarerNavigation();
  
  // Use real booking data instead of mock data
  const { data: allBookings = [], isLoading } = useCarerBookings(user?.id || '');
  
  // Filter bookings for current view period
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Get staff branch ID from the bookings (assuming all bookings belong to same branch)
  const staffBranchId = allBookings[0]?.branch_id;
  
  // Get leave status for the current view period
  const periodStart = viewMode === 'month' ? monthStart : weekStart;
  const periodEnd = viewMode === 'month' ? monthEnd : weekEnd;
  const { data: leaveStatus } = useLeaveStatus(
    staffBranchId || '',
    format(periodStart, 'yyyy-MM-dd'),
    format(periodEnd, 'yyyy-MM-dd')
  );
  
  const currentViewBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.start_time);
    return bookingDate >= periodStart && bookingDate <= periodEnd;
  });
  
  // Keep weekBookings for backward compatibility with day view
  const weekBookings = allBookings.filter(booking => {
    const bookingDate = new Date(booking.start_time);
    return bookingDate >= weekStart && bookingDate <= weekEnd;
  });

  // Get appointments for current period based on view mode
  const periodAppointments = useMemo(() => {
    let appointments = [];
    if (viewMode === 'day') {
      appointments = weekBookings.filter(booking => 
        format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
      );
    } else {
      appointments = currentViewBookings;
    }
    return appointments.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [viewMode, weekBookings, currentViewBookings, currentDate]);

  const visibleAppointments = showAllAppointments ? periodAppointments : periodAppointments.slice(0, 8);

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

  const generateMonthDays = () => {
    // Create a calendar grid starting from Monday
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const dayBookings = currentViewBookings.filter(booking => 
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
      
      return {
        date: day,
        bookings: dayBookings,
        isToday: isToday(day),
        isCurrentMonth: isSameMonth(day, currentDate),
        isOnLeave,
        isAnnualLeave
      };
    });
  };

  const weekDays = generateWeekDays();
  const monthDays = generateMonthDays();

  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      if (direction === 'prev') {
        setCurrentDate(subMonths(currentDate, 1));
      } else {
        setCurrentDate(addMonths(currentDate, 1));
      }
    } else if (viewMode === 'week') {
      if (direction === 'prev') {
        setCurrentDate(subDays(currentDate, 7));
      } else {
        setCurrentDate(addDays(currentDate, 7));
      }
    } else { // day view
      if (direction === 'prev') {
        setCurrentDate(subDays(currentDate, 1));
      } else {
        setCurrentDate(addDays(currentDate, 1));
      }
    }
  };

  const getDateRangeDisplay = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else if (viewMode === 'week') {
      return `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
    } else {
      return formatAppointmentDate(currentDate.toISOString());
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
              <SelectItem value="month">Month View</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigatePeriod('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigatePeriod('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <h2 className="text-lg font-medium">
          {getDateRangeDisplay()}
        </h2>
      </div>

      {/* Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {viewMode === 'month' ? 'Month Summary' : 
             viewMode === 'week' ? 'Week Summary' : 'Day Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {viewMode === 'day' 
                  ? weekBookings.filter(booking => 
                      format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                    ).length
                  : currentViewBookings.length
                }
              </div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {viewMode === 'day'
                  ? weekBookings.filter(booking => 
                      format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
                      booking.status === 'completed'
                    ).length
                  : currentViewBookings.filter(booking => booking.status === 'completed').length
                }
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {viewMode === 'day'
                  ? weekBookings.filter(booking => 
                      format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd') &&
                      (booking.status === 'assigned' || booking.status === 'scheduled')
                    ).length
                  : currentViewBookings.filter(booking => 
                      booking.status === 'assigned' || booking.status === 'scheduled'
                    ).length
                }
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                £{viewMode === 'day'
                  ? weekBookings
                      .filter(booking => 
                        format(new Date(booking.start_time), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                      )
                      .reduce((total, booking) => total + (booking.revenue || 0), 0)
                      .toFixed(2)
                  : currentViewBookings
                      .reduce((total, booking) => total + (booking.revenue || 0), 0)
                      .toFixed(2)
                }
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </div>

          {/* Appointments List */}
          {periodAppointments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm text-gray-700">Appointments</h4>
                {periodAppointments.length > 8 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAllAppointments(!showAllAppointments)}
                    className="text-xs"
                  >
                    {showAllAppointments ? `Show less` : `Show all (${periodAppointments.length})`}
                  </Button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-2">
                {visibleAppointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setShowAppointmentDialog(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <div className="font-medium">
                          {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                        </div>
                        <div className="text-gray-600">
                          {formatAppointmentDate(appointment.start_time)}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{appointment.client_name}</div>
                        <div className="text-gray-600">{appointment.service_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                        {appointment.status === 'assigned' ? 'Scheduled' : appointment.status}
                      </Badge>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div key={booking.id} className="p-2 bg-gray-50 rounded text-xs cursor-pointer hover:bg-gray-100"
                       onClick={() => {
                         setSelectedAppointment(booking);
                         setShowAppointmentDialog(true);
                       }}>
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

      {/* Month View */}
      {viewMode === "month" && (
        <div className="space-y-4">
          {/* Month Calendar Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, index) => (
              <Card key={index} className={`
                min-h-[120px] cursor-pointer transition-all hover:shadow-md
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                ${day.isOnLeave ? 'bg-red-50 border-red-200' : ''}
                ${day.isAnnualLeave ? 'bg-orange-50 border-orange-200' : ''}
                ${!day.isCurrentMonth ? 'opacity-40 bg-gray-50' : ''}
              `}>
                <CardContent className="p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-blue-600' : 
                      !day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    }`}>
                      {format(day.date, 'd')}
                    </span>
                    <div className="flex gap-1">
                      {day.isOnLeave && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                      {day.isAnnualLeave && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    {day.bookings.slice(0, 2).map((booking) => (
                      <div key={booking.id} className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate">
                        {format(new Date(booking.start_time), 'HH:mm')} {booking.client_name}
                      </div>
                    ))}
                    {day.bookings.length > 2 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.bookings.length - 2} more
                      </div>
                    )}
                    {day.bookings.length > 0 && (
                      <div className="text-xs text-center text-gray-600 font-medium">
                        {day.bookings.length} appointment{day.bookings.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <Card key={booking.id} className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedAppointment(booking);
                      setShowAppointmentDialog(true);
                    }}>
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

      {/* Appointment Detail Dialog */}
      <CarerAppointmentDetailDialog
        appointment={selectedAppointment}
        open={showAppointmentDialog}
        onOpenChange={setShowAppointmentDialog}
        onStartVisit={(appointment) => {
          console.log('Starting visit for:', appointment);
          // Handle start visit action
        }}
        onContinueVisit={(appointment) => {
          console.log('Continuing visit for:', appointment);
          // Handle continue visit action  
        }}
        onViewSummary={(appointment) => {
          window.location.href = createCarerPath(`/visit/${appointment.id}?mode=view`);
        }}
      />
    </div>
  );
};

export default CarerSchedule;
