import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCarerServiceReports } from '@/hooks/useServiceReports';
import { useCarerContext, clearCarerContextCache } from '@/hooks/useCarerContext';
import { useCarerCompletedBookings } from '@/hooks/useCarerCompletedBookings';
import { useCarerBookings } from '@/hooks/useCarerBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateServiceReportDialog } from '../service-reports/CreateServiceReportDialog';
import { ViewServiceReportDialog } from '../service-reports/ViewServiceReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Plus, Clock, CheckCircle, AlertTriangle, XCircle, Edit, Eye, Calendar, User, ClipboardList, RefreshCw, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getBookingStatusLabel } from '@/components/bookings/utils/bookingColors';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
export function CarerReportsTab() {
  const queryClient = useQueryClient();
  
  // Destructure loading and error states from ALL hooks
  const {
    data: carerContext,
    isLoading: contextLoading,
    error: contextError
  } = useCarerContext();
  const {
    data: reports = [],
    isLoading: reportsLoading,
    error: reportsError
  } = useCarerServiceReports(carerContext?.staffProfile?.id);
  const {
    data: completedBookings = [],
    isLoading: bookingsLoading
  } = useCarerCompletedBookings(carerContext?.staffProfile?.id);
  const {
    data: allBookings = [],
    isLoading: allBookingsLoading,
    refetch: refetchAllBookings
  } = useCarerBookings(carerContext?.staffProfile?.id);

  // Force refetch ALL carer data on mount to ensure fresh data (fixes missed appointments visibility)
  useEffect(() => {
    if (carerContext?.staffProfile?.id) {
      console.log('[CarerReportsTab] Component mounted, invalidating ALL carer data for fresh data');
      
      // Clear localStorage cache to prevent stale data issues
      if (carerContext.staffProfile?.auth_user_id) {
        clearCarerContextCache(carerContext.staffProfile.auth_user_id);
      }
      
      // Invalidate all related queries for fresh data (including carer-appointments-full for sync)
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
      queryClient.invalidateQueries({ queryKey: ['carer-context'] });
    }
  }, [carerContext?.staffProfile?.id, queryClient]);

  // Handler for manual refresh
  const handleForceRefresh = () => {
    console.log('[CarerReportsTab] Manual refresh triggered');
    
    // Clear all caches
    clearCarerContextCache();
    
    // Invalidate all queries (including carer-appointments-full for sync with Appointments tab)
    queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
    queryClient.invalidateQueries({ queryKey: ['carer-service-reports'] });
    queryClient.invalidateQueries({ queryKey: ['carer-context'] });
    
    // Refetch bookings
    refetchAllBookings();
    
    toast.info('Refreshing appointments...');
  };
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<any>(null);
  const [bookingReportDialogOpen, setBookingReportDialogOpen] = useState(false);
  const [selectedVisitRecordId, setSelectedVisitRecordId] = useState<string | null>(null);
  const [pastSearchQuery, setPastSearchQuery] = useState('');

  // Completed tab search and filter state
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');
  const [completedDateFrom, setCompletedDateFrom] = useState('');
  const [completedDateTo, setCompletedDateTo] = useState('');

  // Submitted tab search and filter state
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState('');
  const [submittedDateFrom, setSubmittedDateFrom] = useState('');
  const [submittedDateTo, setSubmittedDateTo] = useState('');

  // Action Required tab search and filter state
  const [actionSearchQuery, setActionSearchQuery] = useState('');
  const [actionDateFrom, setActionDateFrom] = useState('');
  const [actionDateTo, setActionDateTo] = useState('');

  // Fetch visit record ID when a booking is selected for report
  // ✅ This useEffect is now at the TOP, before any conditional returns
  useEffect(() => {
    const fetchVisitRecord = async () => {
      if (!selectedBookingForReport?.id) return;
      const {
        data,
        error
      } = await supabase.from('visit_records').select('id').eq('booking_id', selectedBookingForReport.id).order('created_at', {
        ascending: false
      }).limit(1).maybeSingle();
      if (data) {
        setSelectedVisitRecordId(data.id);
      } else {
        setSelectedVisitRecordId(null);
      }
    };
    if (selectedBookingForReport) {
      fetchVisitRecord();
    }
  }, [selectedBookingForReport]);

  // ✅ ALL useMemo hooks MUST be called BEFORE any early returns (React Hooks rule)
  // Move all derived state calculations here to prevent "Rendered more hooks" error
  
  // Derived state: Filter reports by status - Simplified 3-tab structure
  const { pendingReports, completedReports, revisionReports } = useMemo(() => {
    return {
      pendingReports: reports.filter(r => r.status === 'pending'),
      completedReports: reports.filter(r => r.status === 'approved' || r.status === 'rejected'),
      revisionReports: reports.filter(r => r.status === 'requires_revision')
    };
  }, [reports]);

  // Derived state: Filtered and sorted completed reports (latest first + search/date filter)
  const filteredCompletedReports = useMemo(() => {
    // First, sort by completion timestamp (reviewed_at > submitted_at > created_at) DESC
    let sorted = [...completedReports].sort((a, b) => {
      const dateA = new Date(a.reviewed_at || a.submitted_at || a.created_at).getTime();
      const dateB = new Date(b.reviewed_at || b.submitted_at || b.created_at).getTime();
      return dateB - dateA; // Latest first
    });

    // Apply client name search filter
    if (completedSearchQuery.trim()) {
      const query = completedSearchQuery.toLowerCase().trim();
      sorted = sorted.filter(report => {
        const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.toLowerCase();
        return clientName.includes(query);
      });
    }

    // Apply date from filter
    if (completedDateFrom) {
      sorted = sorted.filter(report => report.service_date >= completedDateFrom);
    }

    // Apply date to filter
    if (completedDateTo) {
      sorted = sorted.filter(report => report.service_date <= completedDateTo);
    }

    return sorted;
  }, [completedReports, completedSearchQuery, completedDateFrom, completedDateTo]);

  // Derived state: Filtered submitted (pending) reports
  const filteredSubmittedReports = useMemo(() => {
    let filtered = [...pendingReports].sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.created_at).getTime();
      const dateB = new Date(b.submitted_at || b.created_at).getTime();
      return dateB - dateA; // Latest first
    });

    if (submittedSearchQuery.trim()) {
      const query = submittedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(report => {
        const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.toLowerCase();
        return clientName.includes(query);
      });
    }

    if (submittedDateFrom) {
      filtered = filtered.filter(report => report.service_date >= submittedDateFrom);
    }
    if (submittedDateTo) {
      filtered = filtered.filter(report => report.service_date <= submittedDateTo);
    }

    return filtered;
  }, [pendingReports, submittedSearchQuery, submittedDateFrom, submittedDateTo]);


  // Derived state: Past appointments with report status
  // ALIGNED with CarerAppointments.tsx categorization logic for data parity
  const pastAppointmentsWithReportStatus = useMemo(() => {
    const now = new Date();
    
    // Filter past appointments - MATCH CarerAppointments.tsx categorizeAppointments() logic
    const pastAppointments = allBookings.filter(booking => {
      if (!booking.start_time) return false;
      try {
        const startTime = new Date(booking.start_time);
        if (isNaN(startTime.getTime())) return false;
        
        // Only exclude cancelled bookings (matching CarerAppointments.tsx line 296-300)
        if (booking.status === 'cancelled') return false;
        
        // Check if visit is actually completed (visit_record status trumps booking status)
        // This matches CarerAppointments.tsx lines 307-314
        const visitRecords = booking.visit_records || [];
        const isVisitCompleted = visitRecords.length > 0 && 
          visitRecords[0]?.status === 'completed' &&
          visitRecords[0]?.visit_end_time;
        
        const isPastStartTime = startTime < now;
        const isCompleted = ['completed', 'done'].includes(booking.status || '') || isVisitCompleted;
        const isMissed = booking.status === 'missed'; // Include missed appointments regardless of time
        
        // Include if: past start time OR has completed visit record OR is marked missed
        // This ensures missed appointments appear even if start_time hasn't passed in the UI's timezone
        return isPastStartTime || isCompleted || isMissed;
      } catch (e) {
        console.warn('[CarerReportsTab] Invalid date for booking:', booking.id);
        return false;
      }
    });
    
    // Enhanced diagnostic logging for debugging - now includes visit_records info
    console.log('[CarerReportsTab] Past appointments diagnostic:', {
      staffId: carerContext?.staffProfile?.id,
      authUserId: carerContext?.staffProfile?.auth_user_id,
      totalBookings: allBookings.length,
      missedBookings: allBookings.filter(b => b.status === 'missed').length,
      pastCount: pastAppointments.length,
      pastMissedCount: pastAppointments.filter(b => b.status === 'missed').length,
      excludedCancelled: allBookings.filter(b => b.status === 'cancelled').length,
      bookingsWithVisitRecords: allBookings.filter(b => b.visit_records && b.visit_records.length > 0).length,
      completedVisitRecords: allBookings.filter(b => b.visit_records?.[0]?.status === 'completed').length,
      statusBreakdown: allBookings.reduce((acc, b) => {
        acc[b.status || 'unknown'] = (acc[b.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    // Track missed appointments breakdown for debugging
    const missedInPast = pastAppointments.filter(b => b.status === 'missed');
    console.log('[CarerReportsTab] Missed appointments breakdown:', {
      totalMissed: missedInPast.length,
      missedWithSubmittedReports: missedInPast.filter(b => 
        reports.some(r => r.booking_id === b.id && ['pending', 'approved', 'rejected'].includes(r.status))
      ).length,
      missedNeedingReports: missedInPast.filter(b => 
        !reports.some(r => r.booking_id === b.id && ['pending', 'approved', 'rejected'].includes(r.status))
      ).length
    });

    // Cross-reference with reports to get full report status
    // CRITICAL: Only count submitted/approved/rejected reports as "complete" for Action Required
    // Draft reports should NOT hide appointments from Action Required
    return pastAppointments.map(booking => {
      const bookingReports = reports
        .filter(r => r.booking_id === booking.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const latestReport = bookingReports[0] || null;
      
      // Only consider submitted+ reports as "complete" for Action Required filtering
      const completedStatuses = ['pending', 'approved', 'rejected'];
      const hasCompletedReport = latestReport && completedStatuses.includes(latestReport.status);
      
      return {
        ...booking,
        has_report: hasCompletedReport, // Only true for submitted+ reports
        has_any_report: !!latestReport, // Track if any report exists (for display)
        report: latestReport,
        report_status: latestReport?.status || null
      };
    });
  }, [allBookings, reports, carerContext?.staffProfile?.id, carerContext?.staffProfile?.auth_user_id]);

  // Derived state: Filtered action required data
  // Includes appointments that need reports (has_report: false) - including missed appointments
  const filteredActionRequiredData = useMemo(() => {
    let filteredVisits = pastAppointmentsWithReportStatus.filter(b => !b.has_report);
    let filteredRevisions = [...revisionReports];

    // Log Action Required filtering for debugging
    console.log('[CarerReportsTab] Action Required filtered:', {
      totalPastAppointments: pastAppointmentsWithReportStatus.length,
      needingReports: filteredVisits.length,
      missedNeedingReports: filteredVisits.filter(b => b.status === 'missed').length,
      byStatus: filteredVisits.reduce((acc, b) => {
        acc[b.status || 'unknown'] = (acc[b.status || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });

    if (actionSearchQuery.trim()) {
      const query = actionSearchQuery.toLowerCase().trim();
      filteredVisits = filteredVisits.filter(booking => {
        const clientName = `${booking.client_first_name || ''} ${booking.client_last_name || ''}`.toLowerCase();
        return clientName.includes(query);
      });
      filteredRevisions = filteredRevisions.filter(report => {
        const clientName = `${report.clients?.first_name || ''} ${report.clients?.last_name || ''}`.toLowerCase();
        return clientName.includes(query);
      });
    }

    if (actionDateFrom) {
      filteredVisits = filteredVisits.filter(booking => {
        const bookingDate = booking.start_time?.split('T')[0];
        return bookingDate && bookingDate >= actionDateFrom;
      });
      filteredRevisions = filteredRevisions.filter(report => report.service_date >= actionDateFrom);
    }
    
    if (actionDateTo) {
      filteredVisits = filteredVisits.filter(booking => {
        const bookingDate = booking.start_time?.split('T')[0];
        return bookingDate && bookingDate <= actionDateTo;
      });
      filteredRevisions = filteredRevisions.filter(report => report.service_date <= actionDateTo);
    }

    return { filteredVisits, filteredRevisions };
  }, [pastAppointmentsWithReportStatus, revisionReports, actionSearchQuery, actionDateFrom, actionDateTo]);

  // Derived state: Filtered past appointments based on search query
  const filteredPastAppointments = useMemo(() => {
    if (!pastSearchQuery.trim()) {
      return pastAppointmentsWithReportStatus;
    }
    
    const query = pastSearchQuery.toLowerCase().trim();
    
    return pastAppointmentsWithReportStatus.filter(booking => {
      try {
        // Search by Booking ID
        const bookingIdMatch = (booking.id || '').toLowerCase().includes(query);
        
        // Search by Client Name
        const clientName = `${booking.client_first_name || ''} ${booking.client_last_name || ''}`.toLowerCase();
        const clientMatch = clientName.includes(query);
        
        // Search by Service Name
        const serviceMatch = (booking.service_name || '').toLowerCase().includes(query);
        
        // Search by Date (with null check for start_time)
        let dateMatch = false;
        if (booking.start_time) {
          try {
            const startTime = new Date(booking.start_time);
            if (!isNaN(startTime.getTime())) {
              const dateFormatted = format(startTime, 'MMM dd, yyyy').toLowerCase();
              const dateISO = format(startTime, 'yyyy-MM-dd');
              dateMatch = dateFormatted.includes(query) || dateISO.includes(query);
            }
          } catch (e) {
            // Ignore date parsing errors for search
          }
        }
        
        // Search by Report Status
        const statusMatch = booking.has_report 
          ? (booking.report?.status || '').toLowerCase().includes(query)
          : 'no report'.includes(query);
        
        return bookingIdMatch || clientMatch || serviceMatch || dateMatch || statusMatch;
      } catch (e) {
        console.warn('[CarerReportsTab] Error filtering booking:', booking.id, e);
        return false;
      }
    });
  }, [pastAppointmentsWithReportStatus, pastSearchQuery]);

  // STEP 1: Check if context is still initializing (highest priority)
  // Also wait for allBookings to finish loading before showing content
  const isInitializing = contextLoading || !carerContext?.staffProfile?.id || allBookingsLoading;
  
  if (isInitializing) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-muted-foreground">
          {contextLoading ? 'Loading your profile...' : allBookingsLoading ? 'Loading past appointments...' : 'Initializing service reports...'}
        </p>
      </div>;
  }

  // STEP 2: Check for context errors
  if (contextError) {
    console.error('[CarerReportsTab] Context error:', contextError);
    return <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <XCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p className="font-medium">Unable to load carer profile</p>
          <p className="text-sm mt-2">{contextError.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>;
  }

  // STEP 3: Check if profile exists (after loading completes)
  if (!carerContext?.staffProfile) {
    return <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">No carer profile found</p>
          <p className="text-sm mt-2">Please contact your administrator</p>
        </div>
      </Card>;
  }

  // STEP 4: Check if service reports are loading
  if (reportsLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-muted-foreground">Loading service reports...</p>
      </div>;
  }

  // STEP 5: Handle service reports errors (non-blocking)
  if (reportsError) {
    console.error('[CarerReportsTab] Reports error:', reportsError);
  }

  // Enhanced debug logging - helps diagnose Service Report visibility issues
  console.log('[CarerReportsTab] Render state:', {
    contextLoading,
    reportsLoading,
    bookingsLoading,
    allBookingsLoading,
    hasCarerContext: !!carerContext,
    hasStaffProfile: !!carerContext?.staffProfile,
    staffId: carerContext?.staffProfile?.id,
    authUserId: carerContext?.staffProfile?.auth_user_id,
    branchId: carerContext?.staffProfile?.branch_id,
    reportsCount: reports.length,
    completedBookingsCount: completedBookings.length,
    allBookingsCount: allBookings.length,
    pastAppointmentsCount: pastAppointmentsWithReportStatus.length,
    contextError: contextError?.message,
    reportsError: reportsError?.message,
    timestamp: new Date().toISOString()
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'requires_revision':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };
  const handleEditReport = async (report: any) => {
    console.log('[handleEditReport] Starting for report:', report.id, 'visit_record_id:', report.visit_record_id);
    
    let updatedReport = report;
    
    // If report already has visit_record_id, just open dialog
    if (report.visit_record_id) {
      setSelectedReport(report);
      setTimeout(() => setEditDialogOpen(true), 0);
      return;
    }
    
    // Try to find existing visit_record by booking_id or create one
    if (report.booking_id) {
      try {
        const { data: existingVR } = await supabase
          .from('visit_records')
          .select('id')
          .eq('booking_id', report.booking_id)
          .maybeSingle();
        
        if (existingVR) {
          console.log('[handleEditReport] Found existing visit record:', existingVR.id);
          // Update the service report with the found visit_record_id
          await supabase
            .from('client_service_reports')
            .update({ visit_record_id: existingVR.id })
            .eq('id', report.id);
          
          updatedReport = { ...report, visit_record_id: existingVR.id };
        } else {
          // Create a new visit record
          console.log('[handleEditReport] Creating new visit record');
          const { data: newVR, error } = await supabase
            .from('visit_records')
            .insert({
              booking_id: report.booking_id,
              client_id: report.client_id,
              staff_id: report.staff_id,
              branch_id: report.branch_id,
              status: 'completed',
            })
            .select('id')
            .single();
          
          if (error) {
            console.error('[handleEditReport] Error creating visit record:', error);
          }
          
          if (newVR) {
            console.log('[handleEditReport] Created new visit record:', newVR.id);
            // Update service report with new visit_record_id
            await supabase
              .from('client_service_reports')
              .update({ visit_record_id: newVR.id })
              .eq('id', report.id);
            
            updatedReport = { ...report, visit_record_id: newVR.id };
          }
        }
      } catch (error) {
        console.error('[handleEditReport] Error handling visit record:', error);
      }
    }
    
    console.log('[handleEditReport] Opening dialog with visit_record_id:', updatedReport.visit_record_id);
    setSelectedReport(updatedReport);
    // Use setTimeout to ensure React has processed the state update
    setTimeout(() => setEditDialogOpen(true), 0);
  };
  return <div className="space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Service Reports</h3>
          <p className="text-sm text-muted-foreground">
            Manage your service reports and track their approval status
          </p>
        </div>
        
      </div>

      {/* Status Overview - Simplified 3-card layout */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <Card className={cn(
          "transition-all",
          (pastAppointmentsWithReportStatus.filter(b => !b.has_report).length + revisionReports.length) > 0 && "ring-2 ring-orange-400 dark:ring-orange-500"
        )}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">
                  {pastAppointmentsWithReportStatus.filter(b => !b.has_report).length + revisionReports.length}
                </p>
                <p className="text-xs text-muted-foreground truncate">Action Required</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{completedReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="action-required" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1 touch-pan-x">
          <TabsList className="inline-flex w-max min-w-full gap-1 p-1">
            <TabsTrigger value="action-required" className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 min-w-[60px]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Action Required</span>
              <span className="text-xs">({pastAppointmentsWithReportStatus.filter(b => !b.has_report).length + revisionReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 min-w-[60px]">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Submitted</span>
              <span className="text-xs">({pendingReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 min-w-[60px]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Completed</span>
              <span className="text-xs">({completedReports.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Action Required Tab - Visits needing reports + Reports needing revision */}
        <TabsContent value="action-required" className="space-y-4">
          {/* Search and Filter Controls with Refresh Button */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by client name..."
                    value={actionSearchQuery}
                    onChange={(e) => setActionSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                  {actionSearchQuery && (
                    <Button variant="ghost" size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                      onClick={() => setActionSearchQuery('')}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleForceRefresh}
                  title="Refresh appointments"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <Input type="date" value={actionDateFrom}
                    onChange={(e) => setActionDateFrom(e.target.value)}
                    placeholder="From date"
                    className="w-full sm:w-[140px] text-sm" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-muted-foreground text-sm hidden sm:inline">to</span>
                  <Input type="date" value={actionDateTo}
                    onChange={(e) => setActionDateTo(e.target.value)}
                    placeholder="To date"
                    className="w-full sm:w-[140px] text-sm" />
                </div>
                {(actionSearchQuery || actionDateFrom || actionDateTo) && (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto"
                    onClick={() => {
                      setActionSearchQuery('');
                      setActionDateFrom('');
                      setActionDateTo('');
                    }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Section 1: Visits Needing Reports - Always show section with empty state if needed */}
          {(filteredActionRequiredData.filteredVisits.length > 0 || (pastAppointmentsWithReportStatus.length === 0 && !allBookingsLoading)) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-orange-500" />
                  Visits Needing Reports ({filteredActionRequiredData.filteredVisits.length})
                </CardTitle>
                <CardDescription>
                  Complete service reports for these past visits
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredActionRequiredData.filteredVisits.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No visits requiring reports</p>
                    <p className="text-sm mt-1">
                      All past appointments have submitted reports.
                    </p>
                    <p className="text-xs mt-2 text-muted-foreground/70">
                      Total past appointments: {pastAppointmentsWithReportStatus.length}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Card Layout */}
                    <div className="block sm:hidden space-y-3">
                      {filteredActionRequiredData.filteredVisits
                        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                        .map(booking => {
                          const startTime = new Date(booking.start_time);
                          return (
                            <Card key={booking.id} className="p-4">
                              <div className="space-y-3">
                                {/* Client Name & Status */}
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 font-medium min-w-0 flex-1">
                                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <span className="truncate">{booking.client_first_name} {booking.client_last_name}</span>
                                  </div>
                                  <Badge 
                                    variant="outline"
                                    className={cn(
                                      "text-xs shrink-0",
                                      booking.status === 'done' && "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
                                      booking.status === 'missed' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
                                      booking.status === 'in_progress' && "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
                                      booking.status === 'in-progress' && "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
                                      !['done', 'missed', 'in_progress', 'in-progress'].includes(booking.status || '') && "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                                    )}
                                  >
                                    {getBookingStatusLabel(booking.status || 'unknown')}
                                  </Badge>
                                </div>
                                
                                {/* Date & Time */}
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(startTime, 'MMM dd, yyyy')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {format(startTime, 'HH:mm')}
                                  </span>
                                </div>
                                
                                {/* Service */}
                                <Badge variant="outline" className="text-xs">
                                  {booking.service_name || 'General Service'}
                                </Badge>
                                
                                {/* Action Button */}
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedBookingForReport(booking);
                                    setBookingReportDialogOpen(true);
                                  }} 
                                  className="w-full"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Report
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                    </div>

                {/* Desktop Table Layout */}
                <div className="hidden sm:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Visit Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActionRequiredData.filteredVisits
                        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                        .map(booking => {
                          const startTime = new Date(booking.start_time);
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {booking.client_first_name} {booking.client_last_name}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {booking.service_name || 'General Service'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  {format(startTime, 'MMM dd, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  {format(startTime, 'HH:mm')}
                                </div>
                              </TableCell>
                              <TableCell>
                              <Badge 
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    booking.status === 'done' && "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
                                    booking.status === 'missed' && "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
                                    booking.status === 'in_progress' && "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
                                    booking.status === 'in-progress' && "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700",
                                    booking.status === 'assigned' && "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
                                    booking.status === 'unassigned' && "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
                                    booking.status === 'cancelled' && "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/50 dark:text-rose-300 dark:border-rose-700",
                                    booking.status === 'departed' && "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/50 dark:text-teal-300 dark:border-teal-700",
                                    booking.status === 'suspended' && "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
                                    booking.status === 'late' && "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700",
                                    booking.status === 'training' && "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700",
                                    !['done', 'missed', 'in_progress', 'in-progress', 'assigned', 'unassigned', 'cancelled', 'departed', 'suspended', 'late', 'training'].includes(booking.status || '') && "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                                  )}
                                >
                                  {getBookingStatusLabel(booking.status || 'unknown')}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    setSelectedBookingForReport(booking);
                                    setBookingReportDialogOpen(true);
                                  }} 
                                  className="flex items-center gap-2"
                                >
                                  <Plus className="h-4 w-4" />
                                  Add Report
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Section 2: Reports Needing Revision */}
          {filteredActionRequiredData.filteredRevisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-5 w-5 text-orange-500" />
                  Reports Needing Revision ({filteredActionRequiredData.filteredRevisions.length})
                </CardTitle>
                <CardDescription>
                  Admin has requested changes to these reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredActionRequiredData.filteredRevisions.map(report => (
                  <ReportCard 
                    key={report.id} 
                    report={report} 
                    canEdit={true} 
                    onEdit={() => handleEditReport(report)}
                    onView={() => {
                      setSelectedReport(report);
                      setViewDialogOpen(true);
                    }}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {filteredActionRequiredData.filteredVisits.length === 0 && filteredActionRequiredData.filteredRevisions.length === 0 && (
            <Card className="p-8">
              <div className="text-center">
                {(actionSearchQuery || actionDateFrom || actionDateTo) ? (
                  <>
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Service Reports Found</h3>
                    <p className="text-sm text-muted-foreground">
                      No service reports found for the selected criteria.
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
                    <p className="text-sm text-muted-foreground">
                      No visits need reports and no reports need revision.
                    </p>
                  </>
                )}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Submitted Tab - Pending admin review */}
        <TabsContent value="submitted" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name..."
                  value={submittedSearchQuery}
                  onChange={(e) => setSubmittedSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {submittedSearchQuery && (
                  <Button variant="ghost" size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSubmittedSearchQuery('')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <Input type="date" value={submittedDateFrom}
                    onChange={(e) => setSubmittedDateFrom(e.target.value)}
                    placeholder="From date"
                    className="w-full sm:w-[140px] text-sm" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-muted-foreground text-sm hidden sm:inline">to</span>
                  <Input type="date" value={submittedDateTo}
                    onChange={(e) => setSubmittedDateTo(e.target.value)}
                    placeholder="To date"
                    className="w-full sm:w-[140px] text-sm" />
                </div>
                {(submittedSearchQuery || submittedDateFrom || submittedDateTo) && (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto"
                    onClick={() => {
                      setSubmittedSearchQuery('');
                      setSubmittedDateFrom('');
                      setSubmittedDateTo('');
                    }}>
                    <X className="h-4 w-4 mr-1" /> Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Reports List */}
          {filteredSubmittedReports.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {submittedSearchQuery || submittedDateFrom || submittedDateTo 
                    ? "No Service Reports Found" 
                    : "No Submitted Reports"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {submittedSearchQuery || submittedDateFrom || submittedDateTo 
                    ? "No service reports found for the selected criteria."
                    : "Reports awaiting admin review will appear here."}
                </p>
              </div>
            </Card>
          ) : (
            filteredSubmittedReports.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                canEdit={true} 
                onEdit={() => handleEditReport(report)}
                onView={() => {
                  setSelectedReport(report);
                  setViewDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>

        {/* Completed Tab - Approved + Rejected */}
        <TabsContent value="completed" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-3">
              {/* Search by Client Name */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by client name..."
                  value={completedSearchQuery}
                  onChange={(e) => setCompletedSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {completedSearchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setCompletedSearchQuery('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Date From */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:block" />
                  <Input
                    type="date"
                    value={completedDateFrom}
                    onChange={(e) => setCompletedDateFrom(e.target.value)}
                    placeholder="From date"
                    className="w-full sm:w-[140px] text-sm"
                  />
                </div>
                
                {/* Date To */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-muted-foreground text-sm hidden sm:inline">to</span>
                  <Input
                    type="date"
                    value={completedDateTo}
                    onChange={(e) => setCompletedDateTo(e.target.value)}
                    placeholder="To date"
                    className="w-full sm:w-[140px] text-sm"
                  />
                </div>
                
                {/* Clear Filters */}
                {(completedSearchQuery || completedDateFrom || completedDateTo) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setCompletedSearchQuery('');
                      setCompletedDateFrom('');
                      setCompletedDateTo('');
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Reports List */}
          {filteredCompletedReports.length === 0 ? (
            <Card className="p-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {completedSearchQuery || completedDateFrom || completedDateTo 
                    ? "No Service Reports Found" 
                    : "No Completed Reports"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {completedSearchQuery || completedDateFrom || completedDateTo 
                    ? "No service reports found for the selected criteria."
                    : "Your approved and finalized reports will appear here."}
                </p>
              </div>
            </Card>
          ) : (
            filteredCompletedReports.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                canEdit={true} 
                onEdit={() => handleEditReport(report)}
                onView={() => {
                  setSelectedReport(report);
                  setViewDialogOpen(true);
                }}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <CreateServiceReportDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Report Dialog */}
      {selectedReport && <CreateServiceReportDialog open={editDialogOpen} onOpenChange={async (open) => {
      setEditDialogOpen(open);
      if (!open) {
        // Force refetch of reports list when dialog closes
        await queryClient.refetchQueries({ queryKey: ['carer-service-reports'] });
        await queryClient.refetchQueries({ queryKey: ['carer-completed-bookings'] });
        setSelectedReport(null);
      }
    }} preSelectedClient={{
      id: selectedReport.client_id,
      name: `${selectedReport.clients?.first_name} ${selectedReport.clients?.last_name}`
    }} preSelectedDate={selectedReport.service_date} bookingId={selectedReport.booking_id} visitRecordId={selectedReport.visit_record_id || undefined} existingReport={selectedReport} mode="edit" adminMode={false} />}

      {/* Create Report from Booking Dialog */}
      {selectedBookingForReport && <CreateServiceReportDialog open={bookingReportDialogOpen} onOpenChange={open => {
      setBookingReportDialogOpen(open);
      if (!open) {
        setSelectedBookingForReport(null);
        setSelectedVisitRecordId(null);
      }
    }} preSelectedClient={{
      id: selectedBookingForReport.client_id,
      name: `${selectedBookingForReport.clients?.first_name} ${selectedBookingForReport.clients?.last_name}`
    }} preSelectedDate={format(new Date(selectedBookingForReport.start_time), 'yyyy-MM-dd')} bookingId={selectedBookingForReport.id} preSelectedBooking={selectedBookingForReport} visitRecordId={selectedVisitRecordId || undefined} />}

      {/* View Report Dialog */}
      {selectedReport && <ViewServiceReportDialog open={viewDialogOpen} onOpenChange={open => {
      setViewDialogOpen(open);
      if (!open) setSelectedReport(null);
    }} report={selectedReport} adminMode={false} />}
    </div>;
}

// Helper Components
function ReportCard({
  report,
  canEdit = false,
  onEdit,
  onView
}: {
  report: any;
  canEdit?: boolean;
  onEdit?: () => void;
  onView?: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_revision':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3" />;
      case 'approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'rejected':
        return <XCircle className="h-3 w-3" />;
      case 'requires_revision':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };
  return <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-2 min-w-0 flex-1">
            <CardTitle className="text-sm sm:text-base flex flex-wrap items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="break-words">{format(new Date(report.service_date), 'EEE, MMM d, yyyy')}</span>
              <Badge variant="custom" className={cn(getStatusColor(report.status), "shrink-0")}>
                {getStatusIcon(report.status)}
                <span className="hidden sm:inline ml-1">{report.status.replace('_', ' ').toUpperCase()}</span>
              </Badge>
            </CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{report.clients?.first_name} {report.clients?.last_name}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" />
                {report.service_duration_minutes} min
              </span>
              <span className="text-xs text-muted-foreground">
                Submitted: {format(new Date(report.submitted_at), 'MMM d, HH:mm')}
              </span>
            </CardDescription>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto shrink-0">
            {onView && (
              <Button onClick={onView} size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Eye className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">View</span>
              </Button>
            )}
            {canEdit && onEdit && <Button onClick={onEdit} size="sm" variant="outline" className="flex-1 sm:flex-none">
                <Edit className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Services Preview */}
          <div>
            <div className="flex flex-wrap gap-1">
              {report.services_provided?.slice(0, 3).map((service: string, index: number) => <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>)}
              {report.services_provided?.length > 3 && <Badge variant="outline" className="text-xs">
                  +{report.services_provided.length - 3} more
                </Badge>}
            </div>
          </div>

          {/* Key indicators */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
              <span className="truncate">{report.client_mood}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
              <span className="truncate">{report.client_engagement}</span>
            </div>
            {report.incident_occurred && <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Incident</span>
              </div>}
            {report.medication_administered && <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-500 shrink-0" />
                <span>Meds</span>
              </div>}
          </div>

          {/* Review notes if any */}
          {report.review_notes && <div className={`p-3 rounded-lg ${report.status === 'rejected' ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' : report.status === 'requires_revision' ? 'bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800' : 'bg-muted'}`}>
              <div className="flex items-center gap-2 mb-1">
                {report.status === 'rejected' && <XCircle className="h-4 w-4 text-red-500" />}
                {report.status === 'requires_revision' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                {report.status !== 'rejected' && report.status !== 'requires_revision' && <Eye className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {report.status === 'rejected' ? 'Rejection Reason:' : report.status === 'requires_revision' ? 'Admin Feedback:' : 'Admin Feedback:'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{report.review_notes}</p>
              {(report.status === 'rejected' || report.status === 'requires_revision') && <p className="text-xs text-muted-foreground mt-2 italic">
                  Click "Edit" above to revise and resubmit this report.
                </p>}
            </div>}
        </div>
      </CardContent>
    </Card>;
}
function EmptyState({
  message
}: {
  message: string;
}) {
  const getEmptyStateContent = () => {
    switch (message) {
      case "No pending reports":
        return {
          icon: <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />,
          title: "No Pending Reports",
          description: "Reports awaiting admin review will appear here."
        };
      case "No approved reports":
        return {
          icon: <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />,
          title: "No Approved Reports",
          description: "Your approved reports will appear here once reviewed by administrators."
        };
      case "No rejected reports":
        return {
          icon: <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />,
          title: "No Rejected Reports",
          description: "Rejected reports will appear here if any need to be resubmitted."
        };
      case "No revision reports":
        return {
          icon: <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />,
          title: "No Reports Needing Revision",
          description: "Reports requiring changes will appear here."
        };
      default:
        return {
          icon: <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />,
          title: "No Service Reports Yet",
          description: "Service reports will appear here after you submit them for completed visits."
        };
    }
  };
  const content = getEmptyStateContent();
  return <Card className="p-8">
      <div className="text-center">
        {content.icon}
        <h3 className="text-lg font-medium mb-2">{content.title}</h3>
        <p className="text-sm text-muted-foreground">
          {content.description}
        </p>
      </div>
    </Card>;
}