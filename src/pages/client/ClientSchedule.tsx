import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Heart, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClientNavigation } from '@/hooks/useClientNavigation';
import { useSimpleClientAuth } from '@/hooks/useSimpleClientAuth';
import { useClientAllAppointments } from '@/hooks/useClientAppointments';
import { appointmentToCalendarEvent } from '@/utils/clientCalendarHelpers';
import { ClientCalendarDayView } from '@/components/client/calendar/ClientCalendarDayView';
import { ClientCalendarWeekView } from '@/components/client/calendar/ClientCalendarWeekView';
import { ClientCalendarMonthView } from '@/components/client/calendar/ClientCalendarMonthView';
import { ClientAppointmentDetailsDialog } from '@/components/client/calendar/ClientAppointmentDetailsDialog';
import { CalendarEvent } from '@/types/calendar';
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, startOfDay } from 'date-fns';

const ClientSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { createClientPath } = useClientNavigation();
  const { data: authData } = useSimpleClientAuth();
  
  // Parse view parameter or default to week - URL is SINGLE SOURCE OF TRUTH
  const viewParam = searchParams.get('view');
  const initialView = useMemo(() => {
    const validViews = ['day', 'week', 'month'];
    if (viewParam && validViews.includes(viewParam)) {
      return viewParam as 'day' | 'week' | 'month';
    }
    return 'week';
  }, [viewParam]);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>(initialView);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Sync view state when URL parameter changes
  useEffect(() => {
    if (initialView !== view) {
      setView(initialView);
    }
  }, [initialView]);
  
  // Handler for view changes - updates URL (single source of truth)
  const handleViewChange = (newView: 'day' | 'week' | 'month') => {
    if (newView !== view) {
      const params = new URLSearchParams(searchParams);
      params.set('view', newView);
      setSearchParams(params, { replace: true });
      setView(newView);
    }
  };
  
  const clientId = authData?.client?.id;
  
  // Fetch appointments
  const { data: appointments, isLoading } = useClientAllAppointments(clientId || '');
  
  // Transform appointments to calendar events
  const calendarEvents = useMemo(() => {
    if (!appointments) return [];
    return appointments.map(appointmentToCalendarEvent);
  }, [appointments]);
  
  // Date navigation handlers
  const handlePreviousDate = () => {
    switch (view) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };
  
  const handleNextDate = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(startOfDay(new Date()));
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };
  
  // Format date display based on view
  const getDateDisplay = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return format(currentDate, 'MMM d, yyyy');
      case 'month':
        return format(currentDate, 'MMMM yyyy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(createClientPath(''))}
              className="p-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">My Care Schedule</h1>
          </div>
          <p className="text-muted-foreground">View and manage your care appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Calendar Controls */}
      <Card className="shadow-sm border-0 bg-gradient-to-br from-background to-secondary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviousDate}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-[200px] text-center">
                <CardTitle className="text-lg">{getDateDisplay()}</CardTitle>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextDate}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToday}
              >
                Today
              </Button>
            </div>

            {/* View Selector */}
            <div className="flex gap-2">
              <Button 
                variant={view === 'day' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleViewChange('day')}
              >
                Day
              </Button>
              <Button 
                variant={view === 'week' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleViewChange('week')}
              >
                Week
              </Button>
              <Button 
                variant={view === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => handleViewChange('month')}
              >
                Month
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Calendar View */}
        <CardContent className="p-0">
          {view === 'day' && (
            <ClientCalendarDayView
              date={currentDate}
              events={calendarEvents}
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'week' && (
            <ClientCalendarWeekView
              date={currentDate}
              events={calendarEvents}
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          )}
          {view === 'month' && (
            <ClientCalendarMonthView
              date={currentDate}
              events={calendarEvents}
              isLoading={isLoading}
              onEventClick={handleEventClick}
            />
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/appointments'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/30 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">View Appointments</h3>
              <p className="text-sm text-muted-foreground">See all upcoming appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/care-plans'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/30 rounded-lg">
              <Heart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Care Plans</h3>
              <p className="text-sm text-muted-foreground">Review your care plan details</p>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(createClientPath('/messages'))}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-950/30 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Contact Care Team</h3>
              <p className="text-sm text-muted-foreground">Message your care providers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointment Details Dialog */}
      <ClientAppointmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        event={selectedEvent}
      />
    </div>
  );
};

export default ClientSchedule;
