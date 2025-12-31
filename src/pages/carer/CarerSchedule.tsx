
import React, { useState, useMemo } from "react";
import { Calendar, Clock, User, MapPin, Phone, Filter, ChevronLeft, ChevronRight, Eye, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday, isTomorrow, isYesterday, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from "date-fns";
import { useCarerDashboard } from "@/hooks/useCarerDashboard";
import { useCarerBookings } from "@/hooks/useCarerBookings";
import { useCarerAuth } from "@/hooks/useCarerAuth";
import { useCarerContext } from "@/hooks/useCarerContext";
import { useLeaveStatus } from "@/hooks/useLeaveManagement";
import { Skeleton } from "@/components/ui/skeleton";
import { CarerAppointmentDetailDialog } from "@/components/carer/CarerAppointmentDetailDialog";
import { CarerUnavailabilityDialog } from "@/components/carer/CarerUnavailabilityDialog";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { useSubmitUnavailability } from "@/hooks/useCarerUnavailability";

const CarerSchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("week"); // week, day, month
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [selectedUnavailabilityAppointment, setSelectedUnavailabilityAppointment] = useState<any>(null);
  
  const { user } = useCarerAuth();
  const { createCarerPath } = useCarerNavigation();
  const { data: carerContext } = useCarerContext();
  const submitUnavailabilityMutation = useSubmitUnavailability();
  
  // Use real booking data instead of mock data
  const { data: allBookings = [], isLoading } = useCarerBookings(carerContext?.staffId || '');
  
  // Filter bookings for current view period
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
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

  // Helper to normalize status for display
  const normalizeStatus = (status: string) => {
    return status === 'in_progress' ? 'in-progress' : status;
  };

  // Enhanced color system with gradients and shadows
  const getStatusColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-emerald-200 shadow-md';
      case 'in-progress':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-200 shadow-md';
      case 'assigned':
      case 'scheduled':
        return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-200 shadow-md';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-200 shadow-md';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-gray-200 shadow-md';
    }
  };

  const getAppointmentBgColor = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:border-emerald-800';
      case 'in-progress':
        return 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 dark:from-blue-950/30 dark:to-blue-900/30 dark:border-blue-800';
      case 'assigned':
      case 'scheduled':
        return 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 dark:from-amber-950/30 dark:to-amber-900/30 dark:border-amber-800';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 dark:from-gray-900/30 dark:to-gray-800/30 dark:border-gray-700';
    }
  };

  const getTodayHighlight = (isToday: boolean) => {
    return isToday ? 'ring-4 ring-primary ring-offset-2 shadow-xl' : '';
  };

  const getUnavailabilityBadge = (request: any) => {
    if (!request) return null;
    
    switch (request.status) {
      case 'pending':
        return (
          <Badge variant="custom" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Unavailability Requested
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="custom" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800 text-xs">
            Unavailability Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="custom" className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800 text-xs">
            Unavailability Rejected
          </Badge>
        );
      case 'reassigned':
        return (
          <Badge variant="custom" className="bg-blue-600 text-white border-blue-700 text-xs">
            Reassigned
          </Badge>
        );
      default:
        return null;
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
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          <Skeleton className="h-10 w-full sm:max-w-xs" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-xl md:text-2xl font-bold">My Schedule</h1>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-full sm:w-32">
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
      <div className="flex items-center justify-between gap-2 mb-6">
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

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {periodAppointments.length}
            </div>
            <div className="text-sm text-blue-100 font-medium">Total Appointments</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {periodAppointments.filter(booking => {
                const status = booking.status?.toLowerCase();
                return status === 'completed' || status === 'done';
              }).length}
            </div>
            <div className="text-sm text-emerald-100 font-medium">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <CardContent className="p-6 text-center">
            <div className="text-3xl md:text-4xl font-bold text-white mb-2">
              {periodAppointments.filter(booking => {
                const status = booking.status?.toLowerCase();
                const bookingDate = new Date(booking.start_time);
                const now = new Date();
                return (status === 'assigned' || status === 'scheduled') && 
                       bookingDate >= now;
              }).length}
            </div>
            <div className="text-sm text-amber-100 font-medium">Scheduled</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <Card className="mb-6 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <CardTitle>
            {viewMode === 'month' ? 'Month Summary' : 
             viewMode === 'week' ? 'Week Summary' : 'Day Summary'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">{periodAppointments.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm text-foreground">Appointments</h4>
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
                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer transition-colors"
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
                        <div className="text-muted-foreground">
                          {formatAppointmentDate(appointment.start_time)}
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">{appointment.client_name}</div>
                        <div className="text-muted-foreground">
                          {appointment.service_names && appointment.service_names.length > 1 
                            ? `${appointment.service_names[0]} +${appointment.service_names.length - 1} more`
                            : appointment.service_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.unavailability_request && getUnavailabilityBadge(appointment.unavailability_request)}
                      <Badge className={`${getStatusColor(appointment.status)} text-xs`}>
                        {appointment.status === 'assigned' ? 'Scheduled' : normalizeStatus(appointment.status)}
                      </Badge>
                      <Eye className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">
              No appointments found for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {weekDays.map((day, index) => (
            <Card 
              key={index} 
              className={`
                transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer border-2
                ${getTodayHighlight(day.isToday)}
                ${day.isOnLeave ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : ''}
                ${day.isAnnualLeave ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : ''}
              `}
            >
              <CardHeader className="pb-3 space-y-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span className={day.isToday ? 'text-primary text-lg' : 'text-foreground'}>
                    {format(day.date, 'EEE')}
                  </span>
                  <div className="flex gap-1">
                    {day.isOnLeave && (
                      <Badge className="bg-red-500 text-white font-semibold shadow-md text-xs">Leave</Badge>
                    )}
                    {day.isAnnualLeave && (
                      <Badge className="bg-orange-500 text-white font-semibold shadow-md text-xs">Holiday</Badge>
                    )}
                  </div>
                </CardTitle>
                
                <CardDescription className={`
                  text-sm font-medium
                  ${day.isToday ? 'text-primary font-bold text-base' : 'text-muted-foreground'}
                `}>
                  {format(day.date, 'MMM dd')}
                </CardDescription>
                
                {day.bookings.length > 0 && (
                  <Badge variant="secondary" className="w-fit text-xs">
                    {day.bookings.length} appointment{day.bookings.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </CardHeader>
              
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {day.bookings.length > 0 ? (
                  day.bookings.map((booking) => (
                    <div 
                      key={booking.id} 
                      className={`
                        p-3 rounded-lg border-2 transition-all duration-200
                        hover:shadow-lg hover:scale-102 cursor-pointer
                        ${getAppointmentBgColor(booking.status)}
                      `}
                      onClick={() => {
                        setSelectedAppointment(booking);
                        setShowAppointmentDialog(true);
                      }}
                    >
                      <div className="font-bold text-base text-foreground mb-2">
                        {format(new Date(booking.start_time), 'HH:mm')}
                      </div>
                      
                      <div className="font-semibold text-sm text-foreground/90 mb-1">
                        {booking.client_name}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-2">
                        {booking.service_names && booking.service_names.length > 0 ? (
                          <>
                            {booking.service_names.slice(0, 2).map((name, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {name}
                              </Badge>
                            ))}
                            {booking.service_names.length > 2 && (
                              <span className="text-xs text-muted-foreground">+{booking.service_names.length - 2} more</span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No service</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Badge className={`${getStatusColor(booking.status)} text-xs font-semibold`}>
                          {booking.status === 'assigned' ? 'Scheduled' : normalizeStatus(booking.status)}
                        </Badge>
                        {booking.unavailability_request && (
                          <div className="text-right">
                            {getUnavailabilityBadge(booking.unavailability_request)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/50 font-medium">No appointments</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Enhanced Month View */}
      {viewMode === "month" && (
        <div className="space-y-4">
          {/* Month Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-base font-bold text-foreground py-3 bg-muted rounded-lg">
                {day}
              </div>
            ))}
          </div>
          
          {/* Month Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, index) => (
              <Card 
                key={index} 
                className={`
                  min-h-[140px] cursor-pointer transition-all duration-300 
                  hover:shadow-xl hover:scale-105 border-2
                  ${getTodayHighlight(day.isToday)}
                  ${day.isOnLeave ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300' : ''}
                  ${day.isAnnualLeave ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300' : ''}
                  ${!day.isCurrentMonth ? 'opacity-50 bg-muted/50' : 'bg-card'}
                `}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`
                      text-lg font-bold
                      ${day.isToday ? 'text-primary text-xl' : 
                        !day.isCurrentMonth ? 'text-muted-foreground' : 'text-foreground'}
                    `}>
                      {format(day.date, 'd')}
                    </span>
                    
                    <div className="flex gap-1">
                      {day.isOnLeave && (
                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-md" title="On Leave"></div>
                      )}
                      {day.isAnnualLeave && (
                        <div className="w-3 h-3 bg-orange-500 rounded-full shadow-md" title="Holiday"></div>
                      )}
                    </div>
                  </div>
                  
                  {day.bookings.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {day.bookings.slice(0, 3).map((booking, idx) => (
                          <div
                            key={idx}
                            className={`
                              w-2 h-2 rounded-full shadow-sm
                              ${booking.status === 'completed' ? 'bg-emerald-500' : ''}
                              ${booking.status === 'in_progress' ? 'bg-blue-500' : ''}
                              ${booking.status === 'assigned' ? 'bg-amber-500' : ''}
                            `}
                            title={`${format(new Date(booking.start_time), 'HH:mm')} - ${booking.client_name}`}
                          />
                        ))}
                        {day.bookings.length > 3 && (
                          <span className="text-xs text-muted-foreground font-medium">+{day.bookings.length - 3}</span>
                        )}
                      </div>
                      
                      <div className="text-xs font-semibold text-foreground/80 text-center bg-muted/50 rounded px-2 py-1">
                        {day.bookings.length} visit{day.bookings.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
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
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong className="text-foreground">{booking.service_names && booking.service_names.length > 1 ? 'Services:' : 'Service:'}</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {booking.service_names && booking.service_names.length > 0 ? (
                            booking.service_names.map((name, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                                {name}
                              </Badge>
                            ))
                          ) : (
                            <span>{booking.service_name || 'No service'}</span>
                          )}
                        </div>
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
                      {booking.unavailability_request && getUnavailabilityBadge(booking.unavailability_request)}
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
        onRequestUnavailability={(appointment) => {
          console.log('[CarerSchedule] Opening unavailability dialog for:', appointment);
          setSelectedUnavailabilityAppointment(appointment);
          setShowUnavailabilityDialog(true);
        }}
      />
      
      {/* Unavailability Dialog */}
      <CarerUnavailabilityDialog
        open={showUnavailabilityDialog}
        onOpenChange={setShowUnavailabilityDialog}
        appointment={selectedUnavailabilityAppointment}
        onSubmit={(reason: string, notes: string) => {
          if (!selectedUnavailabilityAppointment || !carerContext?.staffId) return;

          submitUnavailabilityMutation.mutate({
            booking_id: selectedUnavailabilityAppointment.id,
            staff_id: carerContext.staffId,
            branch_id: selectedUnavailabilityAppointment.branch_id,
            reason,
            notes
          }, {
            onSuccess: () => {
              setShowUnavailabilityDialog(false);
              setSelectedUnavailabilityAppointment(null);
            }
          });
        }}
        isSubmitting={submitUnavailabilityMutation.isPending}
      />
    </div>
  );
};

export default CarerSchedule;
