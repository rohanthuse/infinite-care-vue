import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, Search, Filter, Calendar as CalendarIcon, ChevronDown, Users, Clock, MapPin, AlertCircle, FileText, Share2, Copy } from 'lucide-react';
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
import { createUTCTimestamp, getUserTimezone } from '@/utils/timezoneUtils';
import { useScheduledAgreements, useCreateScheduledAgreement } from '@/data/hooks/agreements';
import { useAnnualLeave, useCreateAnnualLeave, useDeleteAnnualLeave } from '@/hooks/useLeaveManagement';
import { ScheduleAgreementDialog } from '@/components/agreements/ScheduleAgreementDialog';
import { NewMeetingDialog } from './NewMeetingDialog';
import { ViewMeetingDialog } from './ViewMeetingDialog';
import { EditMeetingDialog } from './EditMeetingDialog';
import { NewLeaveDialog } from './NewLeaveDialog';
import { ViewLeaveDialog } from './ViewLeaveDialog';
import { EditLeaveDialog } from './EditLeaveDialog';
import { NewTrainingDialog } from './NewTrainingDialog';
import { ViewTrainingDialog } from './ViewTrainingDialog';
import { EditTrainingDialog } from './EditTrainingDialog';
import { useDeleteClientAppointment } from '@/hooks/useClientAppointments';
import { useDeleteTraining } from '@/hooks/useTrainingCalendar';

import { CalendarExportDialog } from './CalendarExportDialog';
import { CalendarShareDialog } from './CalendarShareDialog';
import { DeleteEventDialog } from './DeleteEventDialog';
import { useUpdateCalendarEvent, useDeleteCalendarEvent } from '@/hooks/useCalendarEvents';
import { ErrorBoundary } from './ErrorBoundary';
import { useDialogManager } from '@/hooks/useDialogManager';
import { useQueryClient } from '@tanstack/react-query';
import { ReplicateRotaDialog } from '@/components/bookings/dialogs/ReplicateRotaDialog';

type ViewType = 'daily' | 'weekly' | 'monthly';

interface OrganizationCalendarViewProps {
  defaultBranchId?: string;
}

export const OrganizationCalendarView = ({ defaultBranchId }: OrganizationCalendarViewProps = {}) => {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>(defaultBranchId || 'all');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');

  // Sync selectedBranch with defaultBranchId when it changes
  useEffect(() => {
    if (defaultBranchId && defaultBranchId !== selectedBranch) {
      console.log('[OrganizationCalendarView] ⚠️ Branch sync:', {
        defaultBranchId,
        selectedBranch,
        syncing: true
      });
      setSelectedBranch(defaultBranchId);
    } else {
      console.log('[OrganizationCalendarView] ✅ Branch already synced:', {
        defaultBranchId,
        selectedBranch
      });
    }
  }, [defaultBranchId, selectedBranch]);

  // Force refetch when branch changes to ensure fresh data
  useEffect(() => {
    if (selectedBranch) {
      console.log('[OrganizationCalendarView] 🔄 Branch changed, clearing cache and refetching');
      
      // Invalidate and immediately refetch
      queryClient.invalidateQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        refetchType: 'active'
      });
      
      // Force immediate refetch
      queryClient.refetchQueries({ 
        queryKey: ['organization-calendar'],
        exact: false,
        type: 'active'
      });
    }
  }, [selectedBranch, queryClient]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [viewBookingDialogOpen, setViewBookingDialogOpen] = useState(false);
  const [editBookingDialogOpen, setEditBookingDialogOpen] = useState(false);
  const [viewMeetingDialogOpen, setViewMeetingDialogOpen] = useState(false);
  const [editMeetingDialogOpen, setEditMeetingDialogOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [viewLeaveDialogOpen, setViewLeaveDialogOpen] = useState(false);
  const [editLeaveDialogOpen, setEditLeaveDialogOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [viewTrainingDialogOpen, setViewTrainingDialogOpen] = useState(false);
  const [editTrainingDialogOpen, setEditTrainingDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
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
  const [replicateDialogOpen, setReplicateDialogOpen] = useState(false);
  const [eventToReplicate, setEventToReplicate] = useState<CalendarEvent | null>(null);
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

  // Log event count for verification
  useEffect(() => {
    if (calendarEvents) {
      console.log('[OrganizationCalendarView] 📊 Event count verification:', {
        date: format(currentDate, 'yyyy-MM-dd'),
        selectedBranch,
        selectedBranchName: branches?.find(b => b.id === selectedBranch)?.name || 'All Branches',
        totalEvents: calendarEvents.length,
        byBranch: calendarEvents.reduce((acc, e) => {
          acc[e.branchName] = (acc[e.branchName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });
    }
  }, [calendarEvents, currentDate, selectedBranch, branches]);

  // Fetch dynamic statistics
  const {
    data: stats,
    isLoading: statsLoading
  } = useOrganizationCalendarStats(
    calendarEvents || [], 
    currentDate,
    selectedBranch !== 'all' ? selectedBranch : undefined
  );

  // Fetch services for booking dialog (including services with null organization_id)
  const {
    data: services
  } = useTenantAwareQuery(['organization-services'], async organizationId => {
    const {
      data,
      error
    } = await supabase.from('services').select('*');
    // Fetch all services to include those with null organization_id
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
  const handleEventClick = async (event: CalendarEvent) => {
    console.log('[OrganizationCalendarView] Event clicked:', event);
    
    if (!event || !event.id) {
      console.error('[OrganizationCalendarView] Invalid event data - cannot open dialog');
      toast.error('Unable to view this appointment - invalid data');
      return;
    }
    
    if (event.type === 'booking') {
      // Fetch full booking data from database
      console.log('[OrganizationCalendarView] Fetching full booking data for ID:', event.id);
      
      const { data: fullBooking, error } = await supabase
        .from('bookings')
        .select(`
          *,
          staff (
            id,
            first_name,
            last_name
          ),
          services (
            id,
            title
          ),
          clients (
            id,
            first_name,
            last_name
          )
        `)
        .eq('id', event.id)
        .single();
      
      if (error) {
        console.error('[OrganizationCalendarView] Error fetching booking:', error);
        toast.error('Unable to load appointment details');
        return;
      }
      
      if (!fullBooking) {
        console.error('[OrganizationCalendarView] Booking not found');
        toast.error('Appointment not found');
        return;
      }
      
      console.log('[OrganizationCalendarView] Full booking data:', fullBooking);
      
      // Transform to match ViewBookingDialog expectations
      const bookingData = {
        ...fullBooking,
        carerName: fullBooking.staff 
          ? `${fullBooking.staff.first_name} ${fullBooking.staff.last_name}` 
          : 'Not assigned',
        carerId: fullBooking.staff_id,
        clientId: fullBooking.client_id,
        clientName: fullBooking.clients
          ? `${fullBooking.clients.first_name} ${fullBooking.clients.last_name}`
          : 'Unknown Client',
      };
      
      setSelectedEvent(event);
      setSelectedBooking(bookingData);
      setViewBookingDialogOpen(true);
    } else if (event.type === 'meeting') {
      // Fetch full meeting data from database
      console.log('[OrganizationCalendarView] Fetching meeting data for ID:', event.id);
      
      const { data: fullAppointment, error } = await supabase
        .from('client_appointments')
        .select(`
          *,
          clients (
            id,
            first_name,
            last_name
          ),
          branches (
            id,
            name
          )
        `)
        .eq('id', event.id)
        .single();
      
      if (error) {
        console.error('[OrganizationCalendarView] Error fetching meeting:', error);
        toast.error('Unable to load meeting details');
        return;
      }
      
      if (!fullAppointment) {
        console.error('[OrganizationCalendarView] Meeting not found');
        toast.error('Meeting not found');
        return;
      }
      
      console.log('[OrganizationCalendarView] Full meeting data:', fullAppointment);
      
      setSelectedEvent(event);
      setSelectedMeeting(fullAppointment);
      setViewMeetingDialogOpen(true);
    } else if (event.type === 'leave') {
      // Fetch full leave data from database
      console.log('[OrganizationCalendarView] Fetching leave data for ID:', event.id);
      
      const { data: fullLeave, error } = await supabase
        .from('annual_leave_calendar')
        .select(`
          *,
          branches (
            id,
            name
          )
        `)
        .eq('id', event.id)
        .single();
      
      if (error) {
        console.error('[OrganizationCalendarView] Error fetching leave:', error);
        toast.error('Unable to load leave details');
        return;
      }
      
      if (!fullLeave) {
        console.error('[OrganizationCalendarView] Leave not found');
        toast.error('Leave not found');
        return;
      }
      
      console.log('[OrganizationCalendarView] Full leave data:', fullLeave);
      
      setSelectedEvent(event);
      setSelectedLeave(fullLeave);
      setViewLeaveDialogOpen(true);
    } else if (event.type === 'training') {
      // Fetch full training data from database
      console.log('[OrganizationCalendarView] Fetching training data for ID:', event.id);
      
      const { data: fullTraining, error } = await supabase
        .from('staff_training_records')
        .select(`
          *,
          staff (
            id,
            first_name,
            last_name,
            email
          ),
          branches (
            id,
            name
          ),
          training_courses (
            id,
            title,
            description,
            category,
            status
          )
        `)
        .eq('id', event.id)
        .single();
      
      if (error) {
        console.error('[OrganizationCalendarView] Error fetching training:', error);
        toast.error('Unable to load training details');
        return;
      }
      
      if (!fullTraining) {
        console.error('[OrganizationCalendarView] Training not found');
        toast.error('Training not found');
        return;
      }
      
      console.log('[OrganizationCalendarView] Full training data:', fullTraining);
      
      setSelectedEvent(event);
      setSelectedTraining(fullTraining);
      setViewTrainingDialogOpen(true);
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
      console.error('No organisation found:', organization);
      toast.error('Please ensure you are logged in and have access to this organisation');
      return;
    }
    console.log('🔍 handleNewEvent called with:', eventType, 'prefilledDate:', prefilledDate);
    console.log('Organization found:', organization?.id);

    // Close dropdown first - this happens synchronously
    setDropdownOpen(false);
    setNewEventType(eventType);

    // Open the appropriate dialog after dropdown closes
    // DON'T clear prefilledDate here - let the dialog handle it
    setTimeout(() => {
      comprehensiveCleanup();
      switch (eventType) {
        case 'booking':
          console.log('Opening booking dialog with date:', prefilledDate);
          setNewBookingDialogOpen(true);
          break;
        case 'agreement':
          console.log('Opening agreement dialog with date:', prefilledDate);
          setAgreementDialogOpen(true);
          break;
        case 'training':
          console.log('Opening training dialog with date:', prefilledDate);
          setTrainingDialogOpen(true);
          break;
        case 'leave':
          console.log('Opening leave dialog with date:', prefilledDate);
          setLeaveDialogOpen(true);
          break;
        case 'meeting':
          console.log('Opening meeting dialog with date:', prefilledDate, 'branch selected:', selectedBranch);
          setMeetingDialogOpen(true);
          break;
        default:
          console.warn('Unknown event type:', eventType);
      }
    }, 50);
  };
  const handleNewBooking = () => {
    handleNewEvent('booking');
  };
  const handleCreateBooking = async (bookingData: any, selectedCarers: any[] = []) => {
    try {
      // Convert local date/time to UTC for database storage
      const userTimezone = getUserTimezone();
      console.log('[handleCreateBooking] Creating booking in timezone:', userTimezone, {
        localDate: bookingData.date,
        localStartTime: bookingData.startTime,
        localEndTime: bookingData.endTime
      });

      const start_time = createUTCTimestamp(bookingData.date, bookingData.startTime);
      const end_time = createUTCTimestamp(bookingData.date, bookingData.endTime);

      console.log('[handleCreateBooking] Converted times for database:', {
        start_time,
        end_time
      });

      await createBookingMutation.mutateAsync({
        branch_id: selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id,
        client_id: bookingData.clientId,
        service_id: bookingData.serviceId,
        staff_id: selectedCarers[0]?.id,
        start_time,
        end_time,
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

  const handleEditMeeting = () => {
    setViewMeetingDialogOpen(false);
    setTimeout(() => {
      setEditMeetingDialogOpen(true);
    }, 100);
  };

  const deleteAppointmentMutation = useDeleteClientAppointment();

  const handleDeleteMeeting = async () => {
    if (!selectedMeeting) return;
    
    try {
      await deleteAppointmentMutation.mutateAsync(selectedMeeting.id);
      setViewMeetingDialogOpen(false);
      setSelectedMeeting(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const handleEditLeave = () => {
    setViewLeaveDialogOpen(false);
    setTimeout(() => {
      setEditLeaveDialogOpen(true);
    }, 100);
  };

  const deleteAnnualLeaveMutation = useDeleteAnnualLeave();

  const handleDeleteLeave = async () => {
    if (!selectedLeave) return;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedLeave.leave_name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteAnnualLeaveMutation.mutateAsync(selectedLeave.id);
      setViewLeaveDialogOpen(false);
      setSelectedLeave(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting leave:', error);
    }
  };

  const handleEditTraining = () => {
    setViewTrainingDialogOpen(false);
    setTimeout(() => {
      setEditTrainingDialogOpen(true);
    }, 100);
  };

  const deleteTrainingMutation = useDeleteTraining();

  const handleDeleteTraining = async () => {
    if (!selectedTraining) return;
    
    try {
      await deleteTrainingMutation.mutateAsync(selectedTraining.id);
      setViewTrainingDialogOpen(false);
      setSelectedTraining(null);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting training:', error);
    }
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
    // Open replicate dialog with the selected event
    if (event.type === 'booking') {
      setEventToReplicate(event);
      setReplicateDialogOpen(true);
    } else {
      toast.info('Replication is currently only available for bookings');
    }
  };
  
  const handleOpenReplicateDialog = () => {
    setEventToReplicate(null);
    setReplicateDialogOpen(true);
  };
  const handleAddEvent = (date?: Date, timeSlot?: Date, eventType?: 'agreement' | 'booking' | 'leave' | 'meeting' | 'training') => {
    // Set the prefilled date/time based on what was clicked
    const eventDate = timeSlot || date || new Date();
    console.log('🔍 Add event clicked:', {
      date: format(eventDate, 'yyyy-MM-dd HH:mm'),
      type: eventType,
      isTimeSlot: !!timeSlot
    });

    // Set prefilled date FIRST before opening any dialogs
    setPrefilledDate(eventDate);

    // If eventType is provided (from popover), directly open the dialog
    if (eventType) {
      handleNewEvent(eventType);
    } else {
      // Fallback for header dropdown usage
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
            <h1 className="text-2xl font-bold text-foreground">Organisation Calendar</h1>
          </div>
          <Badge variant="secondary" className="text-sm">
            {format(currentDate, 'MMMM yyyy')}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleOpenReplicateDialog}>
            <Copy className="h-4 w-4 mr-2" />
            Replicate Rota
          </Button>

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
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer focus:bg-accent focus:text-accent-foreground" onSelect={handleOpenReplicateDialog}>
                <Copy className="h-4 w-4 mr-2" />
                Replicate Rota
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
          {/* Branch Filter Visibility Indicator */}
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {selectedBranch === 'all' 
                ? '👁️ Viewing: All Branches' 
                : `👁️ Viewing: ${branches?.find(b => b.id === selectedBranch)?.name || 'Unknown'}`
              }
            </Badge>
            {stats && (
              <>
                <Badge variant="secondary" className="text-xs">
                  👥 {stats.activeStaff} Active Staff
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📊 {stats.capacityPercentage}% Capacity
                </Badge>
              </>
            )}
          </div>


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
          <ViewBookingDialog 
            open={viewBookingDialogOpen} 
            onOpenChange={(open) => {
              console.log('[ViewBookingDialog] State change:', open);
              setViewBookingDialogOpen(open);
              if (!open) {
                setSelectedEvent(null);
                setSelectedBooking(null);
              }
            }} 
            services={services || []} 
            onEdit={handleEditBooking} 
            branchId={selectedEvent.branchId} 
            booking={selectedBooking}
          />
          
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
         onOpenChange={(open) => {
           setMeetingDialogOpen(open);
           if (!open) {
             setTimeout(() => setPrefilledDate(null), 100);
           }
         }}
         branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} 
         prefilledDate={prefilledDate || currentDate}
         prefilledTime={getTimeFromDate(prefilledDate)}
       />

       {/* View Meeting Dialog */}
       <ViewMeetingDialog
         open={viewMeetingDialogOpen}
         onOpenChange={(open) => {
           setViewMeetingDialogOpen(open);
           if (!open) {
             setSelectedMeeting(null);
             setSelectedEvent(null);
           }
         }}
         appointment={selectedMeeting}
         onEdit={handleEditMeeting}
         onDelete={handleDeleteMeeting}
       />

       {/* Edit Meeting Dialog */}
       {selectedMeeting && (
         <EditMeetingDialog
           open={editMeetingDialogOpen}
           onOpenChange={(open) => {
             setEditMeetingDialogOpen(open);
             if (!open) {
               // Refresh meeting data after edit
               setTimeout(async () => {
                 if (selectedMeeting?.id) {
                   const { data } = await supabase
                     .from('client_appointments')
                     .select(`
                       *,
                       clients (
                         id,
                         first_name,
                         last_name
                       ),
                       branches (
                         id,
                         name
                       )
                     `)
                     .eq('id', selectedMeeting.id)
                     .single();
                   
                   if (data) {
                     setSelectedMeeting(data);
                     setViewMeetingDialogOpen(true);
                   }
                 }
               }, 100);
             }
           }}
           appointment={selectedMeeting}
           branchId={selectedBranch !== 'all' ? selectedBranch : undefined}
         />
       )}

       {/* Leave Dialog */}
       <NewLeaveDialog 
         open={leaveDialogOpen} 
         onOpenChange={(open) => {
           setLeaveDialogOpen(open);
           if (!open) {
             setTimeout(() => setPrefilledDate(null), 100);
           }
         }}
         branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} 
         prefilledDate={prefilledDate || currentDate} 
       />

       {/* View Leave Dialog */}
       <ViewLeaveDialog
         open={viewLeaveDialogOpen}
         onOpenChange={(open) => {
           setViewLeaveDialogOpen(open);
           if (!open) {
             setSelectedLeave(null);
             setSelectedEvent(null);
           }
         }}
         leave={selectedLeave}
         onEdit={handleEditLeave}
         onDelete={handleDeleteLeave}
       />

       {/* Edit Leave Dialog */}
       {selectedLeave && (
         <EditLeaveDialog
           open={editLeaveDialogOpen}
           onOpenChange={(open) => {
             setEditLeaveDialogOpen(open);
             if (!open) {
               // Refresh leave data after edit
               setTimeout(async () => {
                 if (selectedLeave?.id) {
                   const { data } = await supabase
                     .from('annual_leave_calendar')
                     .select(`
                       *,
                       branches (
                         id,
                         name
                       )
                     `)
                     .eq('id', selectedLeave.id)
                     .single();
                   
                   if (data) {
                     setSelectedLeave(data);
                     setViewLeaveDialogOpen(true);
                   }
                 }
               }, 100);
             }
           }}
           leave={selectedLeave}
           branchId={selectedBranch !== 'all' ? selectedBranch : undefined}
         />
       )}

       {/* Training Dialog */}
       <NewTrainingDialog 
         open={trainingDialogOpen} 
         onOpenChange={(open) => {
           setTrainingDialogOpen(open);
           if (!open) {
             setTimeout(() => setPrefilledDate(null), 100);
           }
         }}
         branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id} 
         prefilledDate={prefilledDate || currentDate}
         prefilledTime={getTimeFromDate(prefilledDate)}
       />

       {/* View Training Dialog */}
       <ViewTrainingDialog
         open={viewTrainingDialogOpen}
         onOpenChange={(open) => {
           setViewTrainingDialogOpen(open);
           if (!open) {
             setSelectedTraining(null);
             setSelectedEvent(null);
           }
         }}
         training={selectedTraining}
         onEdit={handleEditTraining}
         onDelete={handleDeleteTraining}
       />

       {/* Edit Training Dialog */}
       {selectedTraining && (
         <EditTrainingDialog
           open={editTrainingDialogOpen}
           onOpenChange={(open) => {
             setEditTrainingDialogOpen(open);
             if (!open) {
               // Refresh training data after edit
               setTimeout(async () => {
                 if (selectedTraining?.id) {
                   const { data } = await supabase
                     .from('staff_training_records')
                     .select(`
                       *,
                       staff (
                         id,
                         first_name,
                         last_name,
                         email
                       ),
                       branches (
                         id,
                         name
                       ),
                       training_courses (
                         id,
                         title,
                         description,
                         category,
                         status
                       )
                     `)
                     .eq('id', selectedTraining.id)
                     .single();
                   
                   if (data) {
                     setSelectedTraining(data);
                     setViewTrainingDialogOpen(true);
                   }
                 }
               }, 100);
             }
           }}
           training={selectedTraining}
           branchId={selectedBranch !== 'all' ? selectedBranch : undefined}
         />
       )}

       {/* Export Dialog */}
      <CalendarExportDialog 
        open={exportDialogOpen} 
        onOpenChange={setExportDialogOpen} 
        events={calendarEvents || []} 
        currentDate={currentDate} 
        branchName={selectedBranch !== 'all' ? branches?.find(b => b.id === selectedBranch)?.name : 'All Branches'}
        branchId={selectedBranch !== 'all' ? selectedBranch : undefined}
      />

      {/* Share Dialog */}
      <CalendarShareDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen} 
        events={calendarEvents || []} 
        currentDate={currentDate} 
        branchName={selectedBranch !== 'all' ? branches?.find(b => b.id === selectedBranch)?.name : 'All Branches'}
        branchId={selectedBranch !== 'all' ? selectedBranch : undefined}
      />

      {/* Delete Event Dialog */}
      <DeleteEventDialog open={deleteEventDialogOpen} onOpenChange={setDeleteEventDialogOpen} event={eventToDelete} onConfirm={handleConfirmDeleteEvent} isDeleting={deleteEventMutation.isPending} />

      {/* Replicate Rota Dialog */}
      <ReplicateRotaDialog 
        open={replicateDialogOpen} 
        onOpenChange={setReplicateDialogOpen} 
        branchId={selectedBranch !== 'all' ? selectedBranch : branches?.[0]?.id || ''} 
        currentDate={currentDate}
        selectedEvent={eventToReplicate}
      />
      </div>
    </ErrorBoundary>;
};