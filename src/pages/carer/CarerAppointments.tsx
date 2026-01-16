
import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin, Phone, Plus, Filter, Play, Eye, ArrowRight, RefreshCw, Loader2, History, ClipboardList, CheckCircle, Receipt } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, isToday, isTomorrow, isYesterday, isThisWeek, differenceInMinutes } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDurationHoursMinutes } from "@/lib/utils";
import { useCarerContext } from "@/hooks/useCarerContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useBookingAttendance } from "@/hooks/useBookingAttendance";
import { CarerAppointmentDetailDialog } from "@/components/carer/CarerAppointmentDetailDialog";
import { useCarerNavigation } from "@/hooks/useCarerNavigation";
import { toast } from "sonner";
import { LateArrivalDialog } from "@/components/bookings/dialogs/LateArrivalDialog";
import { useLateArrivalDetection } from "@/hooks/useLateArrivalDetection";
import { CarePlanDetailsDialog } from "@/components/care/CarePlanDetailsDialog";
import { AddVisitExpenseDialog } from "@/components/carer/AddVisitExpenseDialog";
import { AddAppointmentExtraTimeDialog } from "@/components/carer/AddAppointmentExtraTimeDialog";
import PastAppointmentCard from "@/components/carer/PastAppointmentCard";
import AppointmentExpensesList from "@/components/carer/AppointmentExpensesList";
import { notifyAdminOfLateArrival } from "@/utils/notifyLateArrival";
import { getClientPostcodeWithFallback, getClientDisplayAddress } from "@/utils/postcodeUtils";

const CarerAppointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [completingVisitId, setCompletingVisitId] = useState<string | null>(null);
  const [pastAppointmentsFilter, setPastAppointmentsFilter] = useState({
    dateRange: 'last-30-days',
    clientSearch: '',
    statusFilter: 'all'
  });
  const [upcomingAppointmentsFilter, setUpcomingAppointmentsFilter] = useState({
    dateRange: 'next-30-days',
    clientSearch: ''
  });
  const [showCarePlanDialog, setShowCarePlanDialog] = useState(false);
  const [selectedClientForCarePlan, setSelectedClientForCarePlan] = useState<{
    clientId: string;
    clientName: string;
  } | null>(null);
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false);
  const [selectedAppointmentForExpense, setSelectedAppointmentForExpense] = useState<any>(null);
  const [showAddExtraTimeDialog, setShowAddExtraTimeDialog] = useState(false);
  const [selectedAppointmentForExtraTime, setSelectedAppointmentForExtraTime] = useState<any>(null);
  const { data: carerContext, isLoading: isContextLoading } = useCarerContext();
  const navigate = useNavigate();
  const { createCarerPath } = useCarerNavigation();
  const bookingAttendance = useBookingAttendance();
  const queryClient = useQueryClient();
  
  // Late arrival detection
  const {
    checkLateArrival,
    promptForLateArrivalReason,
    showLateArrivalDialog,
    lateArrivalInfo,
    pendingBookingId,
    clearLateArrivalDialog,
  } = useLateArrivalDetection();

  // Get appointments from database with optimized split query strategy
  // This prevents the Supabase 1000-row limit from hiding future appointments
  const { data: appointments = [], isLoading, isFetching } = useQuery({
    queryKey: ['carer-appointments-full', carerContext?.staffId, statusFilter],
    queryFn: async () => {
      if (!carerContext?.staffId) return [];
      
      const now = new Date();
      const nowISO = now.toISOString();
      // Past window: 90 days lookback for history
      const pastWindowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      console.log('[CarerAppointments] Fetching appointments for staffId:', carerContext.staffId);
      console.log('[CarerAppointments] Query boundaries - now:', nowISO, 'pastWindowStart:', pastWindowStart);
      
      // Map UI status labels to database values
      const statusMapping: { [key: string]: string } = {
        'in-progress': 'in_progress',
        'assigned': 'assigned',
        'scheduled': 'scheduled', 
        'completed': 'completed',
        'cancelled': 'cancelled'
      };

      const selectQuery = `
        *,
        clients(id, first_name, last_name, phone, address, pin_code, client_addresses(*)),
        services(title, description),
        booking_services(
          service_id,
          services(id, title)
        ),
        visit_records(
          id,
          visit_start_time,
          visit_end_time,
          actual_duration_minutes,
          status
        )
      `;

      // Build status filter - exclude cancelled unless explicitly requested
      const shouldExcludeCancelled = statusFilter !== 'cancelled';
      const specificStatusFilter = statusFilter !== 'all' && statusFilter !== 'cancelled' 
        ? statusMapping[statusFilter] || statusFilter 
        : null;

      // Query 1: Future bookings (prioritized - these must always be visible)
      let futureQuery = supabase
        .from('bookings')
        .select(selectQuery)
        .eq('staff_id', carerContext.staffId)
        .gte('start_time', nowISO)
        .order('start_time', { ascending: true })
        .limit(500);

      if (shouldExcludeCancelled) {
        futureQuery = futureQuery.neq('status', 'cancelled');
      }
      if (specificStatusFilter) {
        futureQuery = futureQuery.eq('status', specificStatusFilter);
      }

      // Query 2: Past bookings (last 90 days for history)
      let pastQuery = supabase
        .from('bookings')
        .select(selectQuery)
        .eq('staff_id', carerContext.staffId)
        .lt('start_time', nowISO)
        .gte('start_time', pastWindowStart)
        .order('start_time', { ascending: false })
        .limit(500);

      if (shouldExcludeCancelled) {
        pastQuery = pastQuery.neq('status', 'cancelled');
      }
      if (specificStatusFilter) {
        pastQuery = pastQuery.eq('status', specificStatusFilter);
      }

      // Execute both queries in parallel
      const [futureResult, pastResult] = await Promise.all([futureQuery, pastQuery]);

      if (futureResult.error) {
        console.error('[CarerAppointments] Error fetching future appointments:', futureResult.error);
        throw futureResult.error;
      }
      if (pastResult.error) {
        console.error('[CarerAppointments] Error fetching past appointments:', pastResult.error);
        throw pastResult.error;
      }

      // Combine results (future first for logging, then merge and dedupe)
      const futureData = futureResult.data || [];
      const pastData = pastResult.data || [];
      
      console.log('[CarerAppointments] Future appointments fetched:', futureData.length);
      console.log('[CarerAppointments] Past appointments fetched:', pastData.length);
      
      // Log earliest/latest for diagnostics
      if (futureData.length > 0) {
        console.log('[CarerAppointments] Earliest future:', futureData[0]?.start_time);
        console.log('[CarerAppointments] Latest future:', futureData[futureData.length - 1]?.start_time);
      }
      if (pastData.length > 0) {
        console.log('[CarerAppointments] Most recent past:', pastData[0]?.start_time);
        console.log('[CarerAppointments] Oldest past:', pastData[pastData.length - 1]?.start_time);
      }

      // Merge and dedupe by ID
      const allData = [...futureData, ...pastData];
      const uniqueData = Array.from(new Map(allData.map(item => [item.id, item])).values());
      
      // Transform data to include service_names array from booking_services junction
      const transformedData = uniqueData.map(booking => {
        const bookingServices = booking.booking_services || [];
        const serviceNames = bookingServices
          .map((bs: any) => bs.services?.title)
          .filter(Boolean);
        
        return {
          ...booking,
          service_names: serviceNames.length > 0 
            ? serviceNames 
            : (booking.services?.title ? [booking.services.title] : []),
          service_name: serviceNames.length > 0 
            ? serviceNames.join(', ') 
            : (booking.services?.title || 'No Service')
        };
      });
      
      console.log('[CarerAppointments] Total unique appointments:', transformedData.length, 'for staff ID:', carerContext.staffId);
      return transformedData;
    },
    enabled: !!carerContext?.staffId && !isContextLoading,
    staleTime: 0, // Data is immediately stale - always fetch fresh
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    refetchOnReconnect: true, // Refetch when connection restored
  });

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!carerContext?.staffId) return;

    console.log('[CarerAppointments] Setting up real-time subscription for staff:', carerContext.staffId);

    const channel = supabase
      .channel(`carer-bookings-${carerContext.staffId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bookings',
          filter: `staff_id=eq.${carerContext.staffId}`
        },
        (payload) => {
          console.log('[CarerAppointments] Real-time booking update received:', payload);
          
          // Invalidate and refetch immediately
          queryClient.invalidateQueries({ 
            queryKey: ['carer-appointments-full', carerContext.staffId] 
          });
          
          // Show a subtle notification
          if (payload.eventType === 'UPDATE' && payload.new.status === 'done') {
            toast.info('Visit status updated', { duration: 2000 });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visit_records',
          filter: `staff_id=eq.${carerContext.staffId}`
        },
        (payload) => {
          console.log('[CarerAppointments] Real-time visit_record update received:', payload);
          
          // Refetch appointments when visit records change
          queryClient.invalidateQueries({ 
            queryKey: ['carer-appointments-full', carerContext.staffId] 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_services'
        },
        (payload) => {
          console.log('[CarerAppointments] Real-time booking_services update received:', payload);
          
          // Refetch appointments when booking services change
          queryClient.invalidateQueries({ 
            queryKey: ['carer-appointments-full', carerContext.staffId] 
          });
        }
      )
      .subscribe((status) => {
        console.log('[CarerAppointments] Subscription status:', status);
      });

    return () => {
      console.log('[CarerAppointments] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [carerContext?.staffId, queryClient]);

  // Filter appointments based on search term
  const filteredAppointments = appointments.filter(appointment => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.toLowerCase();
    const serviceName = appointment.services?.title?.toLowerCase() || '';
    
    return clientName.includes(searchLower) || serviceName.includes(searchLower);
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700';
      case 'in-progress':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700';
      case 'assigned':
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-700';
      case 'missed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    if (isThisWeek(date)) return format(date, "EEEE");
    return format(date, "MMM dd, yyyy");
  };

  // Check if appointment can be started
  const canStartAppointment = (appointment: any) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const appointmentDate = format(startTime, 'yyyy-MM-dd');
    const todayDate = format(now, 'yyyy-MM-dd');
    
    // Exclude completed/done/cancelled appointments
    const excludedStatuses = ['completed', 'done', 'cancelled'];
    if (excludedStatuses.includes(appointment.status)) {
      return false;
    }
    
    // Allow starting any appointment on the current day, or within 4 hours on other days
    const isToday = appointmentDate === todayDate;
    const minutesDiff = differenceInMinutes(startTime, now);
    
    return (
      (appointment.status === 'assigned' || appointment.status === 'scheduled' || appointment.status === 'confirmed') &&
      (isToday || (minutesDiff <= 240 && minutesDiff >= -240))
    );
  };

  // Categorize appointments with enhanced logging
  const categorizeAppointments = (appointments: any[]) => {
    const now = new Date();
    const todayDate = format(now, 'yyyy-MM-dd');
    
    const current: any[] = [];
    const today: any[] = [];
    const upcoming: any[] = [];
    const past: any[] = [];

    console.log('[categorizeAppointments] Processing', appointments.length, 'appointments');

    // Only filter out cancelled appointments
    // Keep completed/done appointments so they can appear in Past Appointments
    const nonCancelledAppointments = appointments.filter(appointment => 
      appointment.status !== 'cancelled'
    );

    nonCancelledAppointments.forEach((appointment, index) => {
      const appointmentDate = format(new Date(appointment.start_time), 'yyyy-MM-dd');
      const startTime = new Date(appointment.start_time);
      
      // Check if visit is actually completed (visit_record status trumps booking status)
      const isVisitCompleted = appointment.visit_records && 
        appointment.visit_records.length > 0 && 
        appointment.visit_records[0].status === 'completed' &&
        appointment.visit_records[0].visit_end_time;
      
      // Exclude completed/done from "current" and "today" categories
      const excludedFromToday = ['completed', 'done'];
      const isCompleted = excludedFromToday.includes(appointment.status) || isVisitCompleted;
      
      console.log(`[categorizeAppointments] Appointment ${index + 1}/${nonCancelledAppointments.length}:`, {
        id: appointment.id,
        client: `${appointment.clients?.first_name} ${appointment.clients?.last_name}`,
        bookingStatus: appointment.status,
        visitRecordStatus: appointment.visit_records?.[0]?.status,
        isVisitCompleted,
        isCompleted,
        appointmentDate,
        todayDate,
        categorizedAs: isCompleted ? 'PAST' : (appointmentDate === todayDate ? 'TODAY/CURRENT' : 'UPCOMING')
      });
      
      if (appointmentDate === todayDate) {
        // Completed visits on today should go to past
        if (isCompleted) {
          past.push(appointment);
        } else if (canStartAppointment(appointment)) {
          current.push(appointment);
        } else {
          today.push(appointment);
        }
      } else if (startTime > now) {
        // Future appointments go to upcoming (unless completed)
        if (!isCompleted) {
          upcoming.push(appointment);
        } else {
          past.push(appointment);
        }
      } else {
        // Past appointments (includes completed visits)
        past.push(appointment);
      }
    });

    console.log('[categorizeAppointments] Results:', {
      current: current.length,
      today: today.length,
      upcoming: upcoming.length,
      past: past.length
    });

    // Sort each category
    const sortByTime = (a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    const sortByTimeDesc = (a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime();

    return {
      current: current.sort(sortByTime),
      today: today.sort(sortByTime),
      upcoming: upcoming.sort(sortByTime),
      past: past.sort(sortByTimeDesc)
    };
  };

  const handleStartVisit = async (appointment: any) => {
    try {
      console.log('[handleStartVisit] Starting visit for appointment:', appointment);
      console.log('[handleStartVisit] Carer context:', carerContext);
      
      // Validate required data first
      if (!appointment.id) {
        console.error('[handleStartVisit] Missing appointment ID');
        toast.error('Invalid appointment data');
        return;
      }

      if (!carerContext?.staffId) {
        console.error('[handleStartVisit] Missing staff ID');
        toast.error('Carer not authenticated');
        return;
      }

      // Get branch ID - first try from appointment, then from user context
      let branchId = appointment.branch_id;
      if (!branchId) {
        console.log('[handleStartVisit] Getting branch ID from carer context');
        branchId = carerContext?.branchInfo?.id;
      }

      if (!branchId) {
        console.error('[handleStartVisit] Missing branch ID');
        toast.error('Branch information not found');
        return;
      }

      console.log('[handleStartVisit] Using branch ID:', branchId);

      // Check for late arrival
      const lateCheck = await checkLateArrival(appointment.id);
      
      if (lateCheck.isLate) {
        // Show late arrival dialog
        promptForLateArrivalReason(appointment.id, lateCheck);
        return; // Wait for user to provide reason
      }

      // Show loading state
      toast.loading('Starting visit...', { id: 'start-visit' });

      // Process booking attendance
      await bookingAttendance.mutateAsync({
        bookingId: appointment.id,
        staffId: carerContext.staffId,
        branchId: branchId,
        action: 'start_visit',
        location: {
          latitude: 0, // TODO: Get real location
          longitude: 0
        }
      });

      // Success/error toasts are now handled in the hook
      toast.dismiss('start-visit');

      // Navigate to visit workflow
      navigate(createCarerPath(`/visit/${appointment.id}`));
    } catch (error) {
      console.error('[handleStartVisit] Error starting visit:', error);
      toast.dismiss('start-visit');
      // Error toast is now handled in the hook
    }
  };

  // Handle late arrival confirmation
  const handleLateArrivalConfirm = async (reason: string, details?: string) => {
    if (!pendingBookingId || !carerContext?.staffId) return;

    try {
      // Find the appointment
      const appointment = appointments.find(a => a.id === pendingBookingId);
      if (!appointment) return;

      const branchId = appointment.branch_id || carerContext?.branchInfo?.id;
      if (!branchId) return;

      clearLateArrivalDialog();

      // Show loading state
      toast.loading('Starting visit...', { id: 'start-visit' });

      // Process booking attendance with late arrival data
      await bookingAttendance.mutateAsync({
        bookingId: pendingBookingId,
        staffId: carerContext.staffId,
        branchId: branchId,
        action: 'start_visit',
        location: {
          latitude: 0,
          longitude: 0
        },
        lateArrivalReason: reason,
        arrivalDelayMinutes: lateArrivalInfo?.minutesLate || 0,
      });

      toast.dismiss('start-visit');

      // Send admin notification about late arrival
      const clientName = appointment.clients 
        ? `${appointment.clients.first_name} ${appointment.clients.last_name}` 
        : 'Unknown Client';
      const carerName = carerContext.firstName && carerContext.lastName 
        ? `${carerContext.firstName} ${carerContext.lastName}` 
        : 'Carer';
      
      notifyAdminOfLateArrival({
        bookingId: pendingBookingId,
        branchId: branchId,
        organizationId: appointment.organization_id,
        carerName: carerName,
        clientName: clientName,
        minutesLate: lateArrivalInfo?.minutesLate || 0,
        reason: reason,
        startTime: new Date(appointment.start_time),
        endTime: new Date(appointment.end_time),
      });

      // Navigate to visit workflow
      navigate(createCarerPath(`/visit/${pendingBookingId}`));
    } catch (error) {
      console.error('[handleLateArrivalConfirm] Error:', error);
      toast.dismiss('start-visit');
    }
  };

  const getActionButton = (appointment: any) => {
    const status = appointment.status?.toLowerCase();
    const isLoading = bookingAttendance.isPending;
    
    // Check if visit is actually completed (visit_record status)
    const isVisitCompleted = appointment.visit_records && 
      appointment.visit_records.length > 0 && 
      appointment.visit_records[0].status === 'completed' &&
      appointment.visit_records[0].visit_end_time;
    
    console.log('[getActionButton] Rendering button for appointment:', {
      id: appointment.id,
      status: status,
      isVisitCompleted: isVisitCompleted,
      isLoading: isLoading
    });
    
    // If booking status is in_progress but visit is completed, treat as completed
    if (isVisitCompleted && (status === 'in_progress' || status === 'in-progress')) {
      return (
        <div className="flex flex-col items-end gap-2">
          <Badge variant="success" className="bg-green-100 text-green-800 border-green-300">
            ✓ Visit Completed
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => {
              console.log('[getActionButton] Navigating to completed visit in view mode:', appointment.id);
              navigate(createCarerPath(`/visit/${appointment.id}?mode=view`), { 
                state: { viewOnly: true } 
              });
            }}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      );
    }
    
    if (status === 'completed' || status === 'done') {
      return (
        <div className="flex flex-col items-end gap-2">
          <Badge variant="success" className="bg-green-100 text-green-800 border-green-300">
            ✓ Visit Completed
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={() => {
              console.log('[getActionButton] Navigating to completed visit in view mode:', appointment.id);
              navigate(createCarerPath(`/visit/${appointment.id}?mode=view`), { 
                state: { viewOnly: true } 
              });
            }}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4" />
            View Details
          </Button>
        </div>
      );
    }
    
    if (status === 'cancelled') {
      return (
        <Button 
          variant="outline"
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => {
            setSelectedAppointment(appointment);
            setShowDetailDialog(true);
          }}
          disabled={isLoading}
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
      );
    }
    
    if (status === 'in_progress') {
      // Don't show button if this visit is being completed
      if (completingVisitId === appointment.id) {
        return (
          <Badge variant="outline" className="animate-pulse">
            Completing...
          </Badge>
        );
      }
      
      return (
        <Button 
          variant="success"
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => {
            console.log('[getActionButton] Navigating to in-progress visit:', appointment.id);
            navigate(createCarerPath(`/visit/${appointment.id}`));
          }}
          disabled={isLoading}
        >
          <ArrowRight className="h-4 w-4" />
          Continue Visit
        </Button>
      );
    }
    
    if (canStartAppointment(appointment)) {
      return (
        <Button 
          variant="default"
          size="sm" 
          className="flex items-center gap-2"
          onClick={() => handleStartVisit(appointment)}
          disabled={isLoading}
        >
          <Play className="h-4 w-4" />
          {isLoading ? 'Starting...' : 'Start Visit'}
        </Button>
      );
    }
    
    return null;
  };

  const getTimeInfo = (appointment: any) => {
    const now = new Date();
    const startTime = new Date(appointment.start_time);
    const minutesDiff = differenceInMinutes(startTime, now);
    
    if (Math.abs(minutesDiff) <= 240 && appointment.status !== 'completed') {
      if (minutesDiff > 0) {
        return (
          <div className="text-xs text-amber-600 font-medium">
            Starts in {minutesDiff} minutes
          </div>
        );
      } else if (minutesDiff < 0) {
        return (
          <div className="text-xs text-red-600 font-medium">
            Started {Math.abs(minutesDiff)} minutes ago
          </div>
        );
      } else {
        return (
          <div className="text-xs text-green-600 font-medium">
            Starting now
          </div>
        );
      }
    }
    
    return null;
  };

  if (isLoading || isContextLoading) {
    return (
      <div className="w-full min-w-0 max-w-full space-y-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-56 mb-2" />
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full md:w-48" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Manual refresh handler
  const handleManualRefresh = () => {
    toast.promise(
      queryClient.refetchQueries({ 
        queryKey: ['carer-appointments-full', carerContext?.staffId] 
      }),
      {
        loading: 'Refreshing appointments...',
        success: 'Appointments updated!',
        error: 'Failed to refresh'
      }
    );
  };

  // Filter logic for Past Appointments
  const filterPastAppointments = (appointments: any[]) => {
    return appointments.filter(appointment => {
      const matchesClient = pastAppointmentsFilter.clientSearch === '' || 
        `${appointment.clients?.first_name} ${appointment.clients?.last_name}`
          .toLowerCase()
          .includes(pastAppointmentsFilter.clientSearch.toLowerCase());
      
      const matchesStatus = pastAppointmentsFilter.statusFilter === 'all' ||
        appointment.status === pastAppointmentsFilter.statusFilter;
      
      const appointmentDate = new Date(appointment.start_time);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const matchesDateRange = 
        pastAppointmentsFilter.dateRange === 'all' ||
        (pastAppointmentsFilter.dateRange === 'last-7-days' && daysAgo <= 7) ||
        (pastAppointmentsFilter.dateRange === 'last-30-days' && daysAgo <= 30) ||
        (pastAppointmentsFilter.dateRange === 'last-90-days' && daysAgo <= 90);
      
      return matchesClient && matchesStatus && matchesDateRange;
    });
  };

  // Filter logic for Upcoming Appointments
  const filterUpcomingAppointments = (appointments: any[]) => {
    return appointments.filter(appointment => {
      const matchesClient = upcomingAppointmentsFilter.clientSearch === '' || 
        `${appointment.clients?.first_name} ${appointment.clients?.last_name}`
          .toLowerCase()
          .includes(upcomingAppointmentsFilter.clientSearch.toLowerCase());
      
      const appointmentDate = new Date(appointment.start_time);
      const now = new Date();
      const daysAhead = Math.floor((appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      const matchesDateRange = 
        upcomingAppointmentsFilter.dateRange === 'all' ||
        (upcomingAppointmentsFilter.dateRange === 'next-7-days' && daysAhead <= 7) ||
        (upcomingAppointmentsFilter.dateRange === 'next-30-days' && daysAhead <= 30);
      
      return matchesClient && matchesDateRange;
    });
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      {/* Loading overlay during refetch */}
      {isFetching && !isLoading && (
        <div className="fixed top-16 right-4 z-50 bg-background shadow-lg rounded-lg p-3 flex items-center gap-2 border border-border">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Updating appointments...</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">My Appointments</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManualRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            placeholder="Search appointments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="assigned">Scheduled</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Appointments List */}
      {(() => {
        const categorized = categorizeAppointments(filteredAppointments);
        const upcomingCount = categorized.current.length + categorized.today.length + categorized.upcoming.length;
        const pastCount = categorized.past.length;
        const hasAnyAppointments = upcomingCount + pastCount > 0;

        if (!hasAnyAppointments) {
          return (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No appointments found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Try adjusting your search or filters" : "You don't have any appointments yet"}
                </p>
              </CardContent>
            </Card>
          );
        }

        const renderAppointmentCard = (appointment: any) => (
          <Card 
            key={appointment.id} 
            className="hover:shadow-md transition-all cursor-pointer hover:border-primary/50"
            onClick={(e) => {
              // Prevent click when clicking on buttons
              if ((e.target as HTMLElement).closest('button')) {
                return;
              }
              setSelectedAppointment(appointment);
              setShowDetailDialog(true);
            }}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatAppointmentDate(appointment.start_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(appointment.start_time), 'HH:mm')} - {format(new Date(appointment.end_time), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">
                      {appointment.clients?.first_name} {appointment.clients?.last_name}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <strong className="text-foreground">{appointment.service_names && appointment.service_names.length > 1 ? 'Services:' : 'Service:'}</strong>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {appointment.service_names && appointment.service_names.length > 0 ? (
                        appointment.service_names.map((name: string, idx: number) => (
                          <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary whitespace-normal text-left">
                            {name}
                          </Badge>
                        ))
                      ) : (
                        <span>{appointment.services?.title || 'N/A'}</span>
                      )}
                    </div>
                  </div>
                  
                  {(() => {
                    const clientAddress = getClientDisplayAddress(
                      appointment.clients?.client_addresses,
                      appointment.clients?.address
                    );
                    const clientPostcode = getClientPostcodeWithFallback(
                      appointment.clients?.client_addresses,
                      appointment.clients?.pin_code,
                      appointment.clients?.address
                    );
                    
                    return (clientAddress || clientPostcode) ? (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          {clientAddress && <span className="break-words">{clientAddress}</span>}
                          {clientPostcode && (
                            <span className="font-medium text-foreground/80">
                              Postcode: {clientPostcode}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  {getTimeInfo(appointment)}
                  
                  {/* Show visit times for completed visits */}
                  {(appointment.status === 'done' || appointment.status === 'completed') && (
                    <div className="mt-3 pt-3 border-t border-border space-y-3">
                      
                      {/* Scheduled Visit Times */}
                      <div>
                        <div className="text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Scheduled Visit Times
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Start:</span>{' '}
                            <span className="font-medium">
                              {format(new Date(appointment.start_time), 'HH:mm')}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">End:</span>{' '}
                            <span className="font-medium">
                              {format(new Date(appointment.end_time), 'HH:mm')}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span>{' '}
                            <span className="font-medium">
                              {formatDurationHoursMinutes(
                                Math.max(0, differenceInMinutes(new Date(appointment.end_time), new Date(appointment.start_time)))
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actual Visit Times - Only if visit_records exist */}
                      {appointment.visit_records && 
                       appointment.visit_records.length > 0 && 
                       appointment.visit_records[0].visit_start_time && (
                        <div>
                          <div className="text-xs font-semibold mb-2 text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Actual Visit Times
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className="text-muted-foreground">Start:</span>{' '}
                              <span className="font-medium text-green-700">
                                {format(new Date(appointment.visit_records[0].visit_start_time), 'HH:mm')}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>{' '}
                              <span className="font-medium text-green-700">
                                {appointment.visit_records[0].visit_end_time 
                                  ? format(new Date(appointment.visit_records[0].visit_end_time), 'HH:mm')
                                  : 'In Progress'
                                }
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Duration:</span>{' '}
                              <span className="font-medium text-primary">
                                {(() => {
                                  const record = appointment.visit_records[0];
                                  // Use stored actual_duration_minutes if available
                                  if (record.actual_duration_minutes && record.actual_duration_minutes > 0) {
                                    return formatDurationHoursMinutes(record.actual_duration_minutes);
                                  }
                                  // Fallback: calculate from timestamps
                                  if (record.visit_start_time && record.visit_end_time) {
                                    let durationMins = differenceInMinutes(
                                      new Date(record.visit_end_time), 
                                      new Date(record.visit_start_time)
                                    );
                                    // Handle overnight visits
                                    if (durationMins < 0) durationMins += 1440;
                                    return formatDurationHoursMinutes(Math.max(0, durationMins));
                                  }
                                  return '—';
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Expenses Section for Past Appointments */}
                      {(appointment.status === 'completed' || appointment.status === 'done') && (
                        <AppointmentExpensesList bookingId={appointment.id} />
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-row flex-wrap sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  <Badge variant="custom" className={getStatusColor(appointment.status)}>
                    {appointment.status === 'assigned' ? 'Scheduled' : appointment.status}
                  </Badge>
                  {appointment.revenue && (
                    <div className="text-sm text-muted-foreground">
                      £{appointment.revenue}
                    </div>
                  )}
                  {getActionButton(appointment)}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center justify-center gap-2 text-xs flex-1 sm:flex-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      const clientId = appointment.client_id || appointment.clients?.id;
                      const clientName = `${appointment.clients?.first_name || ''} ${appointment.clients?.last_name || ''}`.trim();
                      if (clientId) {
                        setSelectedClientForCarePlan({ clientId, clientName });
                        setShowCarePlanDialog(true);
                      }
                    }}
                  >
                    <ClipboardList className="h-3 w-3" />
                    Care Plan Details
                  </Button>
                  {/* Add Expense button - only show for completed/past appointments */}
                  {(appointment.status === 'completed' || appointment.status === 'done') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center justify-center gap-2 text-xs flex-1 sm:flex-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointmentForExpense(appointment);
                        setShowAddExpenseDialog(true);
                      }}
                    >
                      <Receipt className="h-3 w-3" />
                      Add Expense
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upcoming' | 'past')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Upcoming</span>
                <Badge variant="secondary" className="ml-1">{upcomingCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Past</span>
                <Badge variant="secondary" className="ml-1">{pastCount}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-8 mt-0">
              {upcomingCount === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
                    <p className="text-muted-foreground">You don't have any scheduled appointments</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Ready to Start */}
                  {categorized.current.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <h2 className="text-lg font-semibold text-green-700">Ready to Start</h2>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-0">{categorized.current.length}</Badge>
                      </div>
                      <div className="space-y-4">
                        {categorized.current.map(renderAppointmentCard)}
                      </div>
                    </div>
                  )}

                  {/* Today's Schedule */}
                  {categorized.today.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-blue-700">Today's Schedule</h2>
                        <Badge className="bg-blue-600 text-white border-0">{categorized.today.length}</Badge>
                      </div>
                      <div className="space-y-4">
                        {categorized.today.map(renderAppointmentCard)}
                      </div>
                    </div>
                  )}

                  {/* Upcoming */}
                  {categorized.upcoming.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-amber-600" />
                        <h2 className="text-lg font-semibold text-amber-700">Upcoming Appointments</h2>
                        <Badge className="bg-amber-100 text-amber-700">{categorized.upcoming.length}</Badge>
                      </div>
                      
                      {/* Filter controls for Upcoming */}
                      <div className="flex flex-col md:flex-row gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                        <Input 
                          placeholder="Search client..." 
                          value={upcomingAppointmentsFilter.clientSearch}
                          onChange={(e) => setUpcomingAppointmentsFilter(prev => ({
                            ...prev, 
                            clientSearch: e.target.value
                          }))}
                          className="md:max-w-xs"
                        />
                        <Select 
                          value={upcomingAppointmentsFilter.dateRange}
                          onValueChange={(value) => setUpcomingAppointmentsFilter(prev => ({
                            ...prev,
                            dateRange: value
                          }))}
                        >
                          <SelectTrigger className="md:w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="next-7-days">Next 7 Days</SelectItem>
                            <SelectItem value="next-30-days">Next 30 Days</SelectItem>
                            <SelectItem value="all">All Future</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-4">
                        {filterUpcomingAppointments(categorized.upcoming).map(renderAppointmentCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-6 mt-0">
              {pastCount === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No past appointments</h3>
                    <p className="text-muted-foreground">Your completed appointments will appear here</p>
                  </CardContent>
                </Card>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">Past Appointments</h2>
                    <Badge variant="secondary">{categorized.past.length}</Badge>
                  </div>
                  
                  {/* Filter controls for Past */}
                  <div className="flex flex-col md:flex-row gap-3 mb-4 p-4 bg-muted/30 rounded-lg">
                    <Input 
                      placeholder="Search client..." 
                      value={pastAppointmentsFilter.clientSearch}
                      onChange={(e) => setPastAppointmentsFilter(prev => ({
                        ...prev, 
                        clientSearch: e.target.value
                      }))}
                      className="md:max-w-xs"
                    />
                    <Select 
                      value={pastAppointmentsFilter.dateRange}
                      onValueChange={(value) => setPastAppointmentsFilter(prev => ({
                        ...prev,
                        dateRange: value
                      }))}
                    >
                      <SelectTrigger className="md:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                        <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={pastAppointmentsFilter.statusFilter}
                      onValueChange={(value) => setPastAppointmentsFilter(prev => ({
                        ...prev,
                        statusFilter: value
                      }))}
                    >
                      <SelectTrigger className="md:w-32">
                        <SelectValue />
                      </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="done">Completed</SelectItem>
                            <SelectItem value="completed">Done</SelectItem>
                            <SelectItem value="missed">Missed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    {filterPastAppointments(categorized.past).map((appointment: any) => (
                      <PastAppointmentCard
                        key={appointment.id}
                        appointment={appointment}
                        onViewDetails={(apt) => {
                          setSelectedAppointment(apt);
                          setShowDetailDialog(true);
                        }}
                        onCarePlanDetails={(clientId, clientName) => {
                          setSelectedClientForCarePlan({ clientId, clientName });
                          setShowCarePlanDialog(true);
                        }}
                        onAddExpense={(apt) => {
                          setSelectedAppointmentForExpense(apt);
                          setShowAddExpenseDialog(true);
                        }}
                        onAddExtraTime={(apt) => {
                          setSelectedAppointmentForExtraTime(apt);
                          setShowAddExtraTimeDialog(true);
                        }}
                        formatAppointmentDate={formatAppointmentDate}
                        getStatusColor={getStatusColor}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        );
      })()}

      {/* Appointment Detail Dialog */}
      <CarerAppointmentDetailDialog
        appointment={selectedAppointment}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onStartVisit={handleStartVisit}
        onContinueVisit={(appointment) => navigate(createCarerPath(`/visit/${appointment.id}`))}
      />

      {/* Late Arrival Dialog */}
      {lateArrivalInfo && (
        <LateArrivalDialog
          open={showLateArrivalDialog}
          onOpenChange={(open) => {
            if (!open) clearLateArrivalDialog();
          }}
          onConfirm={handleLateArrivalConfirm}
          minutesLate={lateArrivalInfo.minutesLate}
          staffName={lateArrivalInfo.staffName}
        />
      )}

      {/* Care Plan Details Dialog */}
      {selectedClientForCarePlan && (
        <CarePlanDetailsDialog
          clientId={selectedClientForCarePlan.clientId}
          clientName={selectedClientForCarePlan.clientName}
          open={showCarePlanDialog}
          onOpenChange={setShowCarePlanDialog}
        />
      )}

      {/* Add Visit Expense Dialog */}
      <AddVisitExpenseDialog
        open={showAddExpenseDialog}
        onOpenChange={setShowAddExpenseDialog}
        appointment={selectedAppointmentForExpense}
      />

      {/* Add Appointment Extra Time Dialog */}
      <AddAppointmentExtraTimeDialog
        open={showAddExtraTimeDialog}
        onOpenChange={setShowAddExtraTimeDialog}
        appointment={selectedAppointmentForExtraTime}
      />
    </div>
  );
};

export default CarerAppointments;
