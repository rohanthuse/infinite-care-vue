import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Search, Filter, Calendar as CalendarIcon, ChevronDown, Users, Clock, MapPin, AlertCircle, FileText, Share2 } from 'lucide-react';
import { DateNavigation } from '@/components/bookings/DateNavigation';
import { CalendarDayView } from './CalendarDayView';
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarMonthView } from './CalendarMonthView';
import { ViewBookingDialog } from '@/components/bookings/dialogs/ViewBookingDialog';
import { NewBookingDialog } from '@/components/bookings/dialogs/NewBookingDialog';
import { EditBookingDialog } from '@/components/bookings/dialogs/EditBookingDialog';
import { useOrganizationCalendar } from '@/hooks/useOrganizationCalendar';
import { useOrganizationCalendarStats } from '@/hooks/useOrganizationCalendarStats';
import { useTenantAwareQuery } from '@/hooks/useTenantAware';
import { useCreateBooking } from '@/data/hooks/useCreateBooking';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useScheduledAgreements, useCreateScheduledAgreement } from '@/data/hooks/agreements';
import { useAnnualLeave, useCreateAnnualLeave } from '@/hooks/useLeaveManagement';
import { ScheduleAgreementDialog } from '@/components/agreements/ScheduleAgreementDialog';
import { NewMeetingDialog } from './NewMeetingDialog';
import { NewLeaveDialog } from './NewLeaveDialog';
import { NewTrainingDialog } from './NewTrainingDialog';
import { BranchCombobox } from './BranchCombobox';
import { CalendarExportDialog } from './CalendarExportDialog';
import { CalendarShareDialog } from './CalendarShareDialog';
import { DeleteEventDialog } from './DeleteEventDialog';
import { useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendarEvents';
import { ErrorBoundary } from './ErrorBoundary';
import { useDialogManager } from '@/hooks/useDialogManager';
import { useQueryClient } from '@tanstack/react-query';
type ViewType = 'daily' | 'weekly' | 'monthly';
export const OrganizationCalendarView = () => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewBookingDialogOpen, setViewBookingDialogOpen] = useState(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [newEventType, setNewEventType] = useState<'booking' | 'agreement' | 'training' | 'leave' | 'meeting'>('booking');
  const [newBookingDialogOpen, setNewBookingDialogOpen] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteEventDialogOpen, setDeleteEventDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState<Date | null>(null);
  const {
    organization
  } = useTenant();
  const {
    closeAllDropdowns
  } = useDialogManager();

  // Fetch branches for the current organization
  const {
    data: branches
  } = useTenantAwareQuery(['organization-branches'], async organizationId => {
    const {
      data,
      error
    } = await supabase.from('branches').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data;
  }, {
    enabled: !!organization?.id
  });
  const {
    data: calendarEvents,
    isLoading
  } = useOrganizationCalendar({
    date: currentDate,
    viewType,
    searchTerm,
    branchId: selectedBranch !== 'all' ? selectedBranch : undefined,
    eventType: selectedEventType !== 'all' ? selectedEventType : undefined
  });

  // Fetch dynamic statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useOrganizationCalendarStats(calendarEvents || [], currentDate);

  // Fetch services for booking dialog
  const {
    data: services
  } = useTenantAwareQuery(['organization-services'], async organizationId => {
    const {
      data,
      error
    } = await supabase.from('services').select('*').eq('organization_id', organizationId);
    if (error) throw error;
    return data;
  }, {
    enabled: !!organization?.id
  });

  // Fetch carers for booking dialog
  const {
    data: carers
  } = useTenantAwareQuery(['organization-carers'], async organizationId => {
    const {
      data,
      error
    } = await supabase.from('staff').select('id, first_name, last_name, email').eq('status', 'active').in('branch_id', (await supabase.from('branches').select('id').eq('organization_id', organizationId)).data?.map(b => b.id) || []);
    if (error) throw error;
    return data?.map(carer => ({
      ...carer,
      name: `${carer.first_name} ${carer.last_name}`
    })) || [];
  }, {
    enabled: !!organization?.id
  });
  const createBookingMutation = useCreateBooking();
  const updateEventMutation = useUpdateCalendarEvent();
  const deleteEventMutation = useDeleteCalendarEvent();
  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };
  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
  };
  const handleEventClick = (event: CalendarEvent) => {
    console.log('Event clicked:', event);
    if (event.type === 'booking') {
      // Convert CalendarEvent to booking format for dialog
      const bookingData = {
        id: event.id,
        date: format(event.startTime, 'yyyy-MM-dd'),
        startTime: format(event.startTime, 'HH:mm'),
        endTime: format(event.endTime, 'HH:mm'),
        status: event.status,
        clientName: event.participants?.find(p => p.role === 'client')?.name || 'Unknown Client',
        carerName: event.participants?.find(p => p.role === 'staff')?.name || 'Unknown Staff',
        clientId: event.clientId,
        carerId: event.staffIds?.[0],
        service_id: null,
        // This would need to be part of CalendarEvent if needed
        notes: '' // This would need to be part of CalendarEvent if needed
      };
      setSelectedEvent(event);
      setViewBookingDialogOpen(true);
    }
  };

  // Comprehensive cleanup function to handle all potential UI state conflicts
  const comprehensiveCleanup = () => {
    try {
      // Remove all aria-hidden and inert attributes from key containers
      const elementsToCleanup = [document.getElementById('root'), document.querySelector('.group\\/sidebar-wrapper'), ...document.querySelectorAll('[data-radix-popper-content-wrapper]'), ...document.querySelectorAll('[data-radix-dropdown-menu-content]'), ...document.querySelectorAll('[data-radix-dialog-overlay]'), ...document.querySelectorAll('[aria-hidden="true"]')];
      elementsToCleanup.forEach(element => {
        if (element) {
          element.removeAttribute('aria-hidden');
          element.removeAttribute('inert');
        }
      });

      // Remove any orphaned popper portals
      const orphanedPortals = document.querySelectorAll('[data-radix-popper-content-wrapper]:empty');
      orphanedPortals.forEach(portal => portal.remove());

      // Restore document scroll
      document.body.style.removeProperty('overflow');
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('pointer-events');

      // Return focus to the original trigger
      setTimeout(() => {
        const trigger = document.querySelector('[data-radix-dropdown-menu-trigger]') as HTMLElement;
        if (trigger && trigger.offsetParent !== null && !trigger.hasAttribute('aria-hidden')) {
          trigger.focus();
        }
      }, 0);
    } catch (error) {
      console.error('Error in comprehensive cleanup:', error);
    }
  };

  // Proper event handler that manages dropdown and dialog state transitions
  const handleNewEvent = (eventType: 'booking' | 'agreement' | 'training' | 'leave' | 'meeting') => {
    // Ensure user is properly authenticated
    if (!organization?.id) {
      console.error('No organization found:', organization);
      toast.error('Please ensure you are logged in and have access to this organization');
      return;
    }
    console.log('handleNewEvent called with:', eventType);
    console.log('Organization found:', organization?.id);

    // Close dropdown first - this happens synchronously
    setDropdownOpen(false);
    setNewEventType(eventType);

    // Open the appropriate dialog after dropdown closes
    setTimeout(() => {
      comprehensiveCleanup();
      switch (eventType) {
        case 'booking':
          console.log('Opening booking dialog');
          setNewBookingDialogOpen(true);
          break;
        case 'agreement':
          console.log('Opening agreement dialog');
          setAgreementDialogOpen(true);
          break;
        case 'training':
          console.log('Opening training dialog');
          setTrainingDialogOpen(true);
          break;
        case 'leave':
          console.log('Opening leave dialog');
          setLeaveDialogOpen(true);
          break;
        case 'meeting':
          console.log('Opening meeting dialog, branch selected:', selectedBranch);
          setMeetingDialogOpen(true);
          break;
        default:
          console.warn('Unknown event type:', eventType);
      }

      // Clear prefilled date after dialog opens
      setPrefilledDate(null);
    }, 50);
  };
  const handleNewBooking = () => {
    handleNewEvent('booking');
  };
  const handleCreateBooking = async (bookingData: any, selectedCarers: any[] = []) => {
    try {
      await createBookingMutation.mutateAsync({
        branch_id: selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id,
        client_id: bookingData.clientId,
        service_id: bookingData.serviceId,
        staff_id: selectedCarers[0]?.id,
        start_time: `${bookingData.date}T${bookingData.startTime}:00`,
        end_time: `${bookingData.date}T${bookingData.endTime}:00`,
        notes: bookingData.notes,
        status: 'scheduled'
      });
      toast.success('Booking created successfully!');

      // Delay query invalidation until after dialog close to prevent freezing
      setTimeout(() => {
        // The useCreateBooking hook will handle query invalidation
      }, 200);
      setNewBookingDialogOpen(false);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking');
    }
  };
  const handleExportCalendar = () => {
    setExportDialogOpen(true);
  };

  const handleShareCalendar = () => {
    setShareDialogOpen(true);
  };
  const handleEditEvent = (event: CalendarEvent) => {
    console.log('Edit event:', event);
    if (event.type === 'booking') {
      setSelectedEvent(event);
      setEditBookingDialogOpen(true);
    } else {
      toast.info('Edit functionality will be implemented for each event type');
    }
  };
  const handleEditBooking = () => {
    setViewBookingDialogOpen(false);
    setTimeout(() => {
      setEditBookingDialogOpen(true);
    }, 100);
  };
  const handleEditSuccess = async (bookingId: string) => {
    setEditBookingDialogOpen(false);

    // Wait for queries to refetch
    await queryClient.invalidateQueries({
      queryKey: ["organization-calendar"]
    });
    await queryClient.refetchQueries({
      queryKey: ["organization-calendar"]
    });

    // Get fresh data and update selectedEvent
    const updatedEvents = queryClient.getQueryData(["organization-calendar"]) as CalendarEvent[] | undefined;
    if (updatedEvents) {
      const updatedEvent = updatedEvents.find(e => e.id === bookingId);
      if (updatedEvent) {
        setSelectedEvent(updatedEvent);
        setViewBookingDialogOpen(true);
      }
    }
    toast.success("Booking updated successfully!");
  };
  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setDeleteEventDialogOpen(true);
  };
  const handleConfirmDeleteEvent = async (event: CalendarEvent) => {
    try {
      await deleteEventMutation.mutateAsync({
        id: event.id,
        type: event.type
      });
      setDeleteEventDialogOpen(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };
  const handleDuplicateEvent = (event: CalendarEvent) => {
    console.log('Duplicate event:', event);
    // TODO: Implement duplicate functionality
    toast.info('Duplicate functionality will be implemented');
  };
  const handleAddEvent = (date?: Date, timeSlot?: Date, eventType?: 'agreement' | 'booking' | 'leave' | 'meeting' | 'training') => {
    // Set the prefilled date/time based on what was clicked
    const eventDate = timeSlot || date || new Date();
    console.log('Add event clicked for date:', eventDate, 'type:', eventType);

    // If eventType is provided (from popover), directly open the dialog
    if (eventType) {
      setPrefilledDate(eventDate);
      handleNewEvent(eventType);
    } else {
      // Fallback for header dropdown usage
      setPrefilledDate(eventDate);
      setDropdownOpen(true);
    }
  };
  
  // Helper to extract time from Date object
  const getTimeFromDate = (date: Date | null) => {
    if (!date) return undefined;
    return format(date, 'HH:mm');
  };
  const eventTypeColors = {
    booking: 'bg-blue-500',
    meeting: 'bg-purple-500',
    leave: 'bg-orange-500',
    training: 'bg-green-500',
    agreement: 'bg-yellow-500'
  };
  const renderCalendarView = () => {
    switch (viewType) {
      case 'daily':
        return <CalendarDayView date={currentDate} events={calendarEvents} isLoading={isLoading} onEventClick={handleEventClick} onEditEvent={handleEditEvent} onDeleteEvent={handleDeleteEvent} onDuplicateEvent={handleDuplicateEvent} onAddEvent={handleAddEvent} />;
      case 'weekly':
        return <CalendarWeekView date={currentDate} events={calendarEvents} isLoading={isLoading} onEventClick={handleEventClick} onEditEvent={handleEditEvent} onDeleteEvent={handleDeleteEvent} onDuplicateEvent={handleDuplicateEvent} onAddEvent={handleAddEvent} />;
      case 'monthly':
        return <CalendarMonthView date={currentDate} events={calendarEvents} isLoading={isLoading} onEventClick={handleEventClick} onEditEvent={handleEditEvent} onDeleteEvent={handleDeleteEvent} onDuplicateEvent={handleDuplicateEvent} onAddEvent={handleAddEvent} />;
      default:
        return null;
    }
  };
  return <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Organization Calendar</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            {format(currentDate, 'MMMM yyyy')}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShareCalendar}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportCalendar}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          {/* New Booking Button - directly opens Create Single Booking dialog */}
          
          
          {/* New Event Dropdown - shows all event type options */}
          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" data-radix-dropdown-menu-trigger>
                <Plus className="h-4 w-4 mr-2" />
                New Event
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-background border border-border shadow-lg z-50">
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={() => handleNewEvent('booking')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                New Booking
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={() => handleNewEvent('meeting')}>
                <Users className="h-4 w-4 mr-2" />
                New Meeting
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={() => handleNewEvent('training')}>
                <Clock className="h-4 w-4 mr-2" />
                Schedule Training
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={() => handleNewEvent('agreement')}>
                <FileText className="h-4 w-4 mr-2" />
                Schedule Agreement
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={() => handleNewEvent('leave')}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Add Leave/Holiday
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Navigation */}
            <div className="flex-1">
              <DateNavigation currentDate={currentDate} onDateChange={handleDateChange} viewType={viewType} onViewTypeChange={handleViewTypeChange} />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>

              {/* Branch Filter */}
              <BranchCombobox branches={branches?.map(branch => ({
                value: branch.id,
                label: branch.name
              })) || []} value={selectedBranch} onValueChange={setSelectedBranch} placeholder="All Branches" />

              {/* Event Type Filter */}
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="booking">Bookings</SelectItem>
                  <SelectItem value="meeting">Meetings</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="agreement">Agreements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Event Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* All Events Button */}
            <Button variant={selectedEventType === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedEventType('all')} className="flex items-center gap-2 h-8">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-primary/70" />
              <span className="text-sm">All Events</span>
            </Button>
            
            {/* Individual Event Type Buttons */}
            {Object.entries(eventTypeColors).map(([type, color]) => <Button key={type} variant={selectedEventType === type ? 'default' : 'outline'} size="sm" onClick={() => setSelectedEventType(type)} className="flex items-center gap-2 h-8">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm capitalize">{type}</span>
              </Button>)}
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="flex-1">
        <CardContent className="p-0">
          {renderCalendarView()}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">
                  {calendarEvents?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Staff</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? '...' : stats?.activeStaff || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacity</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? '...' : `${stats?.capacityPercentage || 0}%`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conflicts</p>
                <p className="text-2xl font-bold text-foreground">
                  {statsLoading ? '...' : stats?.conflictCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Booking Dialog */}
      <NewBookingDialog open={newBookingDialogOpen} onOpenChange={setNewBookingDialogOpen} onCreateBooking={handleCreateBooking} carers={carers || []} services={services || []} branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} prefilledData={{
        date: currentDate
      }} />

      {/* Booking Details Dialog */}
      {selectedEvent && <>
          <ViewBookingDialog open={viewBookingDialogOpen} onOpenChange={setViewBookingDialogOpen} services={services || []} onEdit={handleEditBooking} branchId={selectedEvent.branchId} booking={{
          id: selectedEvent.id,
          date: format(selectedEvent.startTime, 'yyyy-MM-dd'),
          startTime: format(selectedEvent.startTime, 'HH:mm'),
          endTime: format(selectedEvent.endTime, 'HH:mm'),
          status: selectedEvent.status,
          clientName: selectedEvent.participants?.find(p => p.role === 'client')?.name || 'Unknown Client',
          carerName: selectedEvent.participants?.find(p => p.role === 'staff')?.name || 'Needs Carer Assignment',
          clientId: selectedEvent.clientId,
          carerId: selectedEvent.staffIds?.[0],
          service_id: null,
          notes: '',
          start_time: selectedEvent.startTime.toISOString(),
          end_time: selectedEvent.endTime.toISOString()
        }} />
          
          <EditBookingDialog open={editBookingDialogOpen} onOpenChange={setEditBookingDialogOpen} services={services || []} carers={carers || []} branchId={selectedEvent.branchId} booking={{
          id: selectedEvent.id,
          date: format(selectedEvent.startTime, 'yyyy-MM-dd'),
          startTime: format(selectedEvent.startTime, 'HH:mm'),
          endTime: format(selectedEvent.endTime, 'HH:mm'),
          status: selectedEvent.status,
          clientName: selectedEvent.participants?.find(p => p.role === 'client')?.name || 'Unknown Client',
          carerName: selectedEvent.participants?.find(p => p.role === 'staff')?.name || 'Needs Carer Assignment',
          clientId: selectedEvent.clientId,
          carerId: selectedEvent.staffIds?.[0],
          service_id: null,
          notes: '',
          start_time: selectedEvent.startTime.toISOString(),
          end_time: selectedEvent.endTime.toISOString()
        }} onSuccess={handleEditSuccess} />
        </>}

      {/* Agreement Dialog */}
      <ScheduleAgreementDialog 
        open={agreementDialogOpen} 
        onOpenChange={setAgreementDialogOpen} 
        branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id}
        prefilledDate={prefilledDate || undefined}
        prefilledTime={getTimeFromDate(prefilledDate)}
      />

       {/* Meeting Dialog */}
       <NewMeetingDialog 
         open={meetingDialogOpen} 
         onOpenChange={setMeetingDialogOpen} 
         branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} 
         prefilledDate={prefilledDate || currentDate}
         prefilledTime={getTimeFromDate(prefilledDate)}
       />

       {/* Leave Dialog */}
       <NewLeaveDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen} branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} prefilledDate={prefilledDate || currentDate} />

      {/* Training Dialog */}
      <NewTrainingDialog 
        open={trainingDialogOpen} 
        onOpenChange={setTrainingDialogOpen} 
        branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} 
        prefilledDate={prefilledDate || currentDate}
        prefilledTime={getTimeFromDate(prefilledDate)}
      />

      {/* Export Dialog */}
      <CalendarExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} events={calendarEvents || []} currentDate={currentDate} branchName={selectedBranch !== 'all' ? branches?.find(b => b.id === selectedBranch)?.name : 'All Branches'} />

      {/* Share Dialog */}
      <CalendarShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} events={calendarEvents || []} currentDate={currentDate} branchName={selectedBranch !== 'all' ? branches?.find(b => b.id === selectedBranch)?.name : 'All Branches'} />

      {/* Delete Event Dialog */}
      <DeleteEventDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen} event={eventToDelete} onConfirm={handleConfirmDeleteEvent} isDeleting={deleteEventMutation.isPending} />
      </div>
    </ErrorBoundary>;
};