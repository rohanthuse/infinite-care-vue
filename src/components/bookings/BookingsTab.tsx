import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Badge as BadgeIcon, Edit, Copy, FileText, ChevronDown, CalendarDays, ClipboardList } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BulkUpdateBookingsDialog } from "./dialogs/BulkUpdateBookingsDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Booking } from "./BookingTimeGrid";
import { BookingTimeGrid } from "./BookingTimeGrid";
import { BookingsList } from "./BookingsList";
import { BookingReport } from "./BookingReport";
import { StaffScheduleCalendar } from "./StaffScheduleCalendar";
import { ClientScheduleCalendar } from "./ClientScheduleCalendar";
import { UnifiedScheduleView } from "./UnifiedScheduleView";
import { NewBookingDialog } from "./dialogs/NewBookingDialog";
import { EditBookingDialog } from "./dialogs/EditBookingDialog";
import { ViewBookingDialog } from "./dialogs/ViewBookingDialog";
import { BookingOverlapAlert } from "./BookingOverlapAlert";
import { DateNavigation } from "./DateNavigation";
import { BookingFilters } from "./BookingFilters";
import AppointmentApprovalList from "./AppointmentApprovalList";
import { useBookingData } from "./hooks/useBookingData";
import { useBranchBookingsAll } from "@/data/hooks/useBranchBookingsAll";
import { useBookingHandlers } from "./hooks/useBookingHandlers";
import { useAuthSafe } from "@/hooks/useAuthSafe";
import { useServices } from "@/data/hooks/useServices";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRealTimeBookingSync } from "./hooks/useRealTimeBookingSync";
import { useTenant } from "@/contexts/TenantContext";
import { BookingValidationAlert } from "./BookingValidationAlert";
import { useSearchParams } from "react-router-dom";
import { isValid, format } from "date-fns";
import { useBookingDebug } from "./hooks/useBookingDebug";
import { useQuery } from "@tanstack/react-query";
import { BookingStatusLegend } from "./BookingStatusLegend";
import { LateBookingAlertsBanner } from "./LateBookingAlertsBanner";
import { ReplicateRotaDialog } from "./dialogs/ReplicateRotaDialog";
import { FutureBookingPlanDialog } from "./dialogs/FutureBookingPlanDialog";

interface BookingsTabProps {
  branchId?: string;
}

/**
 * Parse a date-only string (yyyy-MM-dd) into a LOCAL Date without timezone shifts.
 * This prevents issues where parseISO("2026-01-18") might become Jan 17th in some timezones.
 */
function parseDateOnlyLocal(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  // Validate format: yyyy-MM-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
  const day = parseInt(dayStr, 10);
  
  // Create local midnight date
  const date = new Date(year, month, day);
  
  // Validate the date is correct (guards against invalid dates like 2026-02-31)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  
  return date;
}

export function BookingsTab({ branchId }: BookingsTabProps) {
  const { user, loading: authLoading, error: authError } = useAuthSafe();
  const { organization } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial values from URL parameters
  const clientParam = searchParams.get('client');
  const focusBookingId = searchParams.get('focusBookingId');
  const viewParam = searchParams.get('view');
  
  // Parse date parameter or default to today (timezone-safe)
  // URL is the SINGLE SOURCE OF TRUTH for the date
  const urlDateParam = searchParams.get('date');
  const selectedDate = useMemo(() => {
    if (urlDateParam) {
      const parsedDate = parseDateOnlyLocal(urlDateParam);
      if (parsedDate && isValid(parsedDate)) {
        return parsedDate;
      }
    }
    return new Date();
  }, [urlDateParam]);
  
  // Parse view parameter or default to daily - URL is SINGLE SOURCE OF TRUTH
  const initialViewType = useMemo(() => {
    const validViews = ['daily', 'weekly', 'monthly'];
    if (viewParam && validViews.includes(viewParam)) {
      return viewParam as "daily" | "weekly" | "monthly";
    }
    return "daily";
  }, [viewParam]);
  
  const [viewType, setViewType] = useState<"daily" | "weekly" | "monthly">(initialViewType);
  
  // Sync viewType state when URL parameter changes
  useEffect(() => {
    if (initialViewType !== viewType) {
      setViewType(initialViewType);
    }
  }, [initialViewType]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(clientParam ? [clientParam] : []);
  const [selectedCarerIds, setSelectedCarerIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<string>("unified-schedule");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [showBulkUpdateDialog, setShowBulkUpdateDialog] = useState(false);
  const [replicateDialogOpen, setReplicateDialogOpen] = useState(false);
  const [showFuturePlanDialog, setShowFuturePlanDialog] = useState(false);

  // Single handler for date changes - updates URL (single source of truth)
  const handleDateChange = (newDate: Date) => {
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    const currentDateStr = urlDateParam || '';
    
    // Only update if date actually changed
    if (newDateStr !== currentDateStr) {
      console.log('[BookingsTab] handleDateChange:', { from: currentDateStr, to: newDateStr });
      const params = new URLSearchParams(searchParams);
      params.set('date', newDateStr);
      setSearchParams(params, { replace: true });
    }
  };

  // Handler for view type changes - updates URL (single source of truth)
  const handleViewTypeChange = (newViewType: "daily" | "weekly" | "monthly") => {
    if (newViewType !== viewType) {
      console.log('[BookingsTab] handleViewTypeChange:', { from: viewType, to: newViewType });
      const params = new URLSearchParams(searchParams);
      params.set('view', newViewType);
      setSearchParams(params, { replace: true });
      setViewType(newViewType);
    }
  };

  const { data: services = [], isLoading: isLoadingServices } = useServices(organization?.id);
  
  // Pass selectedDate and viewType to useBookingData for range-based fetching
  const { clients, carers, bookings, totalBookingsCount, isLoading } = useBookingData(branchId, selectedDate, viewType);
  
  // Fetch ALL bookings for list view (independent of date navigation)
  const { 
    bookings: allBookingsRaw, 
    totalCount: allBookingsTotalCount, 
    isLoading: isLoadingAllBookings 
  } = useBranchBookingsAll(branchId, {
    enabled: activeView === 'list', // Only fetch when list tab is active
    pageSize: 1000, // Fetch up to 1000 bookings
  });
  
  const { isConnected: isRealTimeConnected } = useRealTimeBookingSync(branchId);
  const { inspectCache } = useBookingDebug(branchId, bookings);

  // Fetch pending request count
  const { data: pendingRequestsData } = useQuery({
    queryKey: ['pending-booking-requests-count', branchId],
    queryFn: async () => {
      if (!branchId) return { count: 0 };
      
      const { count, error } = await supabase
        .from('booking_change_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .eq('branch_id', branchId);
      
      if (error) {
        console.error('Error fetching pending requests count:', error);
        return { count: 0 };
      }
      
      return { count: count || 0 };
    },
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const pendingRequestCount = pendingRequestsData?.count || 0;

  // Initialize URL with today's date if not present (only once on mount)
  useEffect(() => {
    if (!urlDateParam) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      console.log('[BookingsTab] Initializing URL with today:', todayStr);
      const params = new URLSearchParams(searchParams);
      params.set('date', todayStr);
      setSearchParams(params, { replace: true });
    }
  }, []); // Empty deps - only run once on mount

  // Update URL when client/carer filters change (NOT date - that's handled by handleDateChange)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    let changed = false;
    
    // Update client filter
    if (selectedClientIds.length > 0) {
      const newClients = selectedClientIds.join(',');
      if (params.get('clients') !== newClients) {
        params.set('clients', newClients);
        changed = true;
      }
    } else if (params.has('clients')) {
      params.delete('clients');
      changed = true;
    }
    
    // Update carer filter
    if (selectedCarerIds.length > 0) {
      const newCarers = selectedCarerIds.join(',');
      if (params.get('carers') !== newCarers) {
        params.set('carers', newCarers);
        changed = true;
      }
    } else if (params.has('carers')) {
      params.delete('carers');
      changed = true;
    }
    
    if (changed) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedClientIds, selectedCarerIds, searchParams, setSearchParams]);

  // Handle auto-focusing booking from search (supports both 'selected' and 'focusBookingId')
  useEffect(() => {
    const selectedBookingId = searchParams.get('selected') || searchParams.get('focusBookingId');
    if (selectedBookingId && bookings.length > 0) {
      const booking = bookings.find(b => b.id === selectedBookingId);
      if (booking) {
        // Set focus booking ID to highlight it
        setHighlightedBookingId(selectedBookingId);
        console.log('[BookingsTab] Auto-focusing booking:', selectedBookingId);
        
        // Change the calendar date to show that booking (via URL)
        const bookingDate = parseDateOnlyLocal(booking.date);
        if (bookingDate && isValid(bookingDate)) {
          handleDateChange(bookingDate);
        }
        
        // Clean up query parameter after 3 seconds
        setTimeout(() => {
          setHighlightedBookingId(null);
          const params = new URLSearchParams(searchParams);
          params.delete('selected');
          params.delete('focusBookingId');
          setSearchParams(params, { replace: true });
        }, 3000);
      }
    }
  }, [searchParams, bookings, setSearchParams, handleDateChange]);

  const {
    newBookingDialogOpen,
    setNewBookingDialogOpen,
    editBookingDialogOpen,
    setEditBookingDialogOpen,
    selectedBooking,
    newBookingData,
    pendingBookingData, // For recurring booking restoration after conflict
    overlapAlertOpen,
    setOverlapAlertOpen,
    overlapData,
    updateOverlapAlertOpen,
    setUpdateOverlapAlertOpen,
    updateOverlapData,
    isCheckingOverlap,
    isRefreshing,
    handleRefresh,
    handleNewBooking,
    handleEditBooking,
    handleContextMenuBooking,
    handleUpdateBooking,
    handleCreateBooking,
    handleOverlapChooseDifferentCarer,
    handleOverlapModifyTime,
    handleOverlapProceedWithoutCarer,
    handleUpdateOverlapChooseDifferentCarer,
    handleUpdateOverlapModifyTime,
    handleUpdateOverlapProceedWithoutCarer,
    createMultipleBookingsMutation,
    updateBookingMutation,
    forceRefresh
  } = useBookingHandlers(branchId, user);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      // Handle special late/missed status filters
      let matchesStatus = false;
      if (statusFilter === "all") {
        matchesStatus = true;
      } else if (statusFilter === "late") {
        // Filter for late arrivals (is_late_start = true, not missed)
        matchesStatus = booking.is_late_start === true && !booking.is_missed;
      } else if (statusFilter === "missed") {
        // Filter for missed bookings
        matchesStatus = booking.is_missed === true;
      } else {
        matchesStatus = booking.status === statusFilter;
      }
      
      const matchesClient = selectedClientIds.length === 0 || selectedClientIds.includes(booking.clientId);
      const matchesCarer = selectedCarerIds.length === 0 || selectedCarerIds.includes(booking.carerId);
      
      // Determine which filters are active
      const hasClientFilter = selectedClientIds.length > 0;
      const hasCarerFilter = selectedCarerIds.length > 0;
      
      // Apply smart filtering logic
      if (hasClientFilter && hasCarerFilter) {
        // Both filters active: Show bookings that match EITHER clients OR carers
        return matchesStatus && (matchesClient || matchesCarer);
      } else {
        // Single filter or no filter: Use AND logic
        return matchesStatus && matchesClient && matchesCarer;
      }
    });
  }, [bookings, statusFilter, selectedClientIds, selectedCarerIds]);
  
  // Process ALL bookings for list view (convert from DB format to Booking format)
  const processedAllBookings = useMemo((): Booking[] => {
    if (!allBookingsRaw || allBookingsRaw.length === 0) return [];
    
    const clientsMap = Object.fromEntries(clients.map((cl) => [cl.id, cl]));
    const carersMap = Object.fromEntries(carers.map((ca) => [ca.id, ca]));
    
    return allBookingsRaw.map((bk: any) => {
      let client = clientsMap[bk.client_id];
      
      // Use embedded client data if available
      if (!client && bk.client_id && bk.clients) {
        const embeddedClient = bk.clients;
        client = {
          id: embeddedClient.id || bk.client_id,
          name: `${embeddedClient.first_name || ''} ${embeddedClient.last_name || ''}`.trim() || '(Unknown)',
          initials: `${(embeddedClient.first_name || '?')[0]}${(embeddedClient.last_name || '?')[0]}`.toUpperCase(),
          bookingCount: 0,
          bookings: [],
        };
      }
      
      let carer = bk.staff_id ? carersMap[bk.staff_id] : null;
      
      // Extract date and time from ISO strings
      const extractDateSafe = (isoString: string) => {
        if (!isoString) return "";
        try {
          const date = new Date(isoString);
          // Use local timezone to match filter inputs (prevents 1-day offset issues)
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return "";
        }
      };
      
      const extractTimeSafe = (isoString: string, defaultTime = "07:00") => {
        if (!isoString) return defaultTime;
        try {
          const date = new Date(isoString);
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        } catch {
          return defaultTime;
        }
      };
      
      return {
        id: bk.id,
        clientId: bk.client_id,
        clientName: client?.name || "(Unknown Client)",
        clientInitials: client?.initials || "??",
        carerId: bk.staff_id,
        carerName: carer?.name || (!bk.staff_id || bk.status === 'unassigned' ? "Not Assigned" : "(Unknown Carer)"),
        carerInitials: carer?.initials || (!bk.staff_id || bk.status === 'unassigned' ? "—" : "??"),
        startTime: extractTimeSafe(bk.start_time),
        endTime: extractTimeSafe(bk.end_time, "08:00"),
        date: extractDateSafe(bk.start_time),
        status: bk.status || "assigned",
        notes: bk.notes || "",
        start_time: bk.start_time,
        end_time: bk.end_time,
        service_id: bk.service_id,
        service_ids: bk.service_ids || (bk.service_id ? [bk.service_id] : []),
        branch_id: bk.branch_id,
        client_id: bk.client_id,
        cancellation_request_status: bk.cancellation_request_status,
        reschedule_request_status: bk.reschedule_request_status,
        visit_records: bk.visit_records || [],
        location_address: bk.location_address,
        is_late_start: bk.is_late_start || false,
        is_missed: bk.is_missed || false,
        late_start_minutes: bk.late_start_minutes || 0,
      };
    });
  }, [allBookingsRaw, clients, carers]);
  
  // Handler to view late arrivals or missed bookings in list view
  const handleViewLateBookings = (type: 'late' | 'missed') => {
    setStatusFilter(type);
    setActiveView('list');
  };

  // Handle booking view from list
  const handleViewBooking = async (booking: Booking) => {
    console.log("[BookingsTab] View booking from list/calendar:", booking.id);
    
    // Early return for training/meeting entries - these don't have booking details
    if ((booking as any).status === 'training') {
      toast.info('Training Session', {
        description: 'This carer is currently in training. No appointment details available.'
      });
      return;
    }
    
    if ((booking as any).status === 'meeting') {
      toast.info('External Meeting', {
        description: 'This carer is in an external meeting. No appointment details available.'
      });
      return;
    }
    
    // Fetch full booking data from database
    console.log('[BookingsTab] Fetching full booking data from database...');
    
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
        )
      `)
      .eq('id', booking.id)
      .single();
    
    if (error) {
      console.error('[BookingsTab] Error fetching booking:', error);
      toast.error('Unable to load appointment details');
      return;
    }
    
    if (!fullBooking) {
      console.error('[BookingsTab] Booking not found');
      toast.error('Appointment not found');
      return;
    }
    
    console.log('[BookingsTab] Full booking data:', fullBooking);
    
    // Transform to include both formats for compatibility
    // Don't type cast - keep all fields from both formats
    const enrichedBooking = {
      ...booking,              // Keep simplified format (startTime, endTime, date)
      ...fullBooking,          // Add database format (start_time, end_time, service_id)
      status: fullBooking.status as Booking['status'],
      carerName: fullBooking.staff 
        ? `${fullBooking.staff.first_name} ${fullBooking.staff.last_name}` 
        : 'Not assigned',
      // Ensure ISO datetime fields are explicitly included
      start_time: fullBooking.start_time,
      end_time: fullBooking.end_time,
      service_id: fullBooking.service_id,
      service_ids: (fullBooking as any).service_ids || (fullBooking.service_id ? [fullBooking.service_id] : []),
      created_at: fullBooking.created_at,
      // Type-cast request statuses properly
      cancellation_request_status: fullBooking.cancellation_request_status as 'pending' | 'approved' | 'rejected' | null,
      reschedule_request_status: fullBooking.reschedule_request_status as 'pending' | 'approved' | 'rejected' | null,
    };

    console.log('[BookingsTab] Enriched booking with both formats:', {
      id: enrichedBooking.id,
      hasStartTime: !!enrichedBooking.startTime,
      hasEndTime: !!enrichedBooking.endTime,
      hasStartTimeISO: !!enrichedBooking.start_time,
      hasEndTimeISO: !!enrichedBooking.end_time,
      start_time: enrichedBooking.start_time,
      end_time: enrichedBooking.end_time,
    });
    
    setViewingBooking(enrichedBooking);
    setShowViewDialog(true);
  };

  // Handle edit from view dialog
  const handleEditFromView = () => {
    if (viewingBooking) {
      setShowViewDialog(false);
      handleEditBooking(viewingBooking);
    }
  };

  // Show authentication error if present
  if (authError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Authentication Error</p>
          <p className="text-muted-foreground">Please login to view bookings</p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state for authentication or data
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">
            {authLoading ? 'Authenticating...' : 'Loading bookings...'}
          </p>
        </div>
      </div>
    );
  }

  // Show message if user is not authenticated - but allow data fetching if branchId exists
  if (!user && !branchId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Please authenticate to view bookings</p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="mt-4"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-bookings w-full max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Bookings</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isRealTimeConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className="transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh bookings, carers, and clients data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!isRealTimeConnected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      toast.warning("Real-time sync is offline", {
                        description: "Please use the refresh button to update booking data manually"
                      });
                      handleRefresh();
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Offline - Manual Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Real-time sync is disconnected. Click to manually refresh data.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={inspectCache}
          >
            Debug Cache
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={forceRefresh}
            className="dark:bg-secondary dark:text-secondary-foreground"
          >
            Force Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowBulkUpdateDialog(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Bulk Update
          </Button>
          <Button variant="outline" onClick={() => setReplicateDialogOpen(true)}>
            <Copy className="h-4 w-4 mr-2" />
            Replicate Rota
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Reports
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setActiveView("reports")}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Booking Reports
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  // Delay dialog open to allow dropdown to close first
                  setTimeout(() => {
                    setShowFuturePlanDialog(true);
                  }, 50);
                }}
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Future Booking Plan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleNewBooking}>
            <Plus className="h-4 w-4 mr-2" />
            New Booking
          </Button>
        </div>
      </div>

      {/* Enhanced validation alert */}
      <BookingValidationAlert 
        isValidating={isCheckingOverlap}
        isValid={!isCheckingOverlap && !overlapAlertOpen && !updateOverlapAlertOpen}
      />

      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="inline-flex gap-2">
          <TabsTrigger value="unified-schedule">Unified Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="pending-requests">
            Pending Requests
            {pendingRequestCount > 0 && (
              <Badge className="ml-2 bg-orange-500 hover:bg-orange-600 text-white">
                {pendingRequestCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        {/* Booking Status Color Legend */}
        <BookingStatusLegend />
        
        <TabsContent value="unified-schedule" className="space-y-4 w-full overflow-hidden">
          {/* Late/Missed Booking Alerts Banner */}
<LateBookingAlertsBanner 
                  branchId={branchId}
                  selectedDate={selectedDate}
                  viewType={viewType}
                  bookings={filteredBookings}
                  onViewLateArrivals={() => handleViewLateBookings('late')}
                  onViewMissed={() => handleViewLateBookings('missed')}
                />
          
          <DateNavigation 
            currentDate={selectedDate} 
            onDateChange={handleDateChange}
            viewType={viewType}
            onViewTypeChange={handleViewTypeChange}
          />
          
            <BookingFilters
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              selectedClientIds={selectedClientIds}
              onClientChange={setSelectedClientIds}
              selectedCarerIds={selectedCarerIds}
              onCarerChange={setSelectedCarerIds}
              clients={clients}
              carers={carers}
            />

          <UnifiedScheduleView
            date={selectedDate}
            bookings={filteredBookings}
            branchId={branchId}
            clients={clients}
            carers={carers}
            selectedClientIds={selectedClientIds}
            selectedCarerIds={selectedCarerIds}
            selectedStatus={statusFilter}
            viewType={viewType}
            onViewBooking={handleViewBooking}
            onCreateBooking={(clientId, staffId, timeSlot) => {
              handleContextMenuBooking(selectedDate, timeSlot, clientId, staffId);
            }}
          />
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          {/* Late/Missed Booking Alerts Banner */}
          <LateBookingAlertsBanner 
            branchId={branchId}
            selectedDate={selectedDate}
            viewType={viewType}
            bookings={filteredBookings}
            onViewLateArrivals={() => handleViewLateBookings('late')}
            onViewMissed={() => handleViewLateBookings('missed')}
          />
          
          <DateNavigation 
            currentDate={selectedDate} 
            onDateChange={handleDateChange}
            viewType={viewType}
            onViewTypeChange={handleViewTypeChange}
          />
          
          <BookingFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            selectedClientIds={selectedClientIds}
            onClientChange={setSelectedClientIds}
            selectedCarerIds={selectedCarerIds}
            onCarerChange={setSelectedCarerIds}
            clients={clients}
            carers={carers}
          />

          <BookingTimeGrid
            date={selectedDate}
            bookings={filteredBookings}
            clients={clients}
            carers={carers}
            services={services}
            viewType={viewType}
            viewMode="client"
            branchId={branchId}
            onCreateBooking={handleContextMenuBooking}
            onUpdateBooking={handleUpdateBooking}
            onViewBooking={handleViewBooking}
            onEditBooking={handleEditBooking}
            onRequestViewTypeChange={handleViewTypeChange}
            isCheckingOverlap={isCheckingOverlap}
            highlightedBookingId={highlightedBookingId}
          />
        </TabsContent>
        
        <TabsContent value="list">
          {isLoadingAllBookings ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Loading all bookings...</p>
              </div>
            </div>
          ) : (
            <BookingsList 
              bookings={processedAllBookings.length > 0 ? processedAllBookings : filteredBookings} 
              totalCount={processedAllBookings.length > 0 ? allBookingsTotalCount : totalBookingsCount}
              onEditBooking={handleEditBooking}
              onViewBooking={handleViewBooking}
              branchId={branchId}
            />
          )}
        </TabsContent>
        
        <TabsContent value="reports">
          <BookingReport bookings={filteredBookings} />
        </TabsContent>

        <TabsContent value="pending-requests">
          <AppointmentApprovalList branchId={branchId} />
        </TabsContent>

      </Tabs>

      <NewBookingDialog
        open={newBookingDialogOpen}
        onOpenChange={setNewBookingDialogOpen}
        carers={carers}
        services={services}
        onCreateBooking={handleCreateBooking}
        branchId={branchId}
        prefilledData={pendingBookingData || newBookingData}
        preSelectedClientId={selectedClientIds.length === 1 ? selectedClientIds[0] : undefined}
        isCreating={createMultipleBookingsMutation.isPending}
      />

      <EditBookingDialog
        open={editBookingDialogOpen}
        onOpenChange={setEditBookingDialogOpen}
        booking={selectedBooking}
        services={services}
        branchId={branchId}
        carers={carers}
        onSuccess={(bookingId) => {
          console.log('[BookingsTab] Booking updated successfully:', bookingId);
          setEditBookingDialogOpen(false);
        }}
      />

      <BookingOverlapAlert
        open={overlapAlertOpen}
        onOpenChange={setOverlapAlertOpen}
        conflictingBookings={overlapData?.conflictingBookings || []}
        carerName={overlapData?.carerName || ""}
        proposedTime={overlapData?.proposedTime || ""}
        proposedDate={overlapData?.proposedDate || ""}
        availableCarers={overlapData?.availableCarers || []}
        onChooseDifferentCarer={handleOverlapChooseDifferentCarer}
        onModifyTime={handleOverlapModifyTime}
        onProceedWithoutCarer={handleOverlapProceedWithoutCarer}
      />

      <BookingOverlapAlert
        open={updateOverlapAlertOpen}
        onOpenChange={setUpdateOverlapAlertOpen}
        conflictingBookings={updateOverlapData?.conflictingBookings || []}
        carerName={updateOverlapData?.carerName || ""}
        proposedTime={updateOverlapData?.proposedTime || ""}
        proposedDate={updateOverlapData?.proposedDate || ""}
        availableCarers={updateOverlapData?.availableCarers || []}
        onChooseDifferentCarer={handleUpdateOverlapChooseDifferentCarer}
        onModifyTime={handleUpdateOverlapModifyTime}
        onProceedWithoutCarer={handleUpdateOverlapProceedWithoutCarer}
      />

      <ViewBookingDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        booking={viewingBooking}
        services={services}
        onEdit={handleEditFromView}
        branchId={branchId}
      />

      <BulkUpdateBookingsDialog
        open={showBulkUpdateDialog}
        onOpenChange={setShowBulkUpdateDialog}
        branchId={branchId || ""}
        carers={carers}
        clients={clients}
      />

      <ReplicateRotaDialog 
        open={replicateDialogOpen} 
        onOpenChange={setReplicateDialogOpen} 
        branchId={branchId || ''} 
        currentDate={selectedDate}
      />

      <FutureBookingPlanDialog
        open={showFuturePlanDialog}
        onOpenChange={setShowFuturePlanDialog}
        bookings={bookings}
        carers={carers.map(c => ({ id: c.id, name: c.name, email: c.email }))}
        branchName={organization?.name || "Branch"}
        branchId={branchId}
      />
    </div>
  );
}
