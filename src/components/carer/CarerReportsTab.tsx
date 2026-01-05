import React, { useState, useEffect, useMemo } from 'react';
import { useCarerServiceReports } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
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
export function CarerReportsTab() {
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
    isLoading: allBookingsLoading
  } = useCarerBookings(carerContext?.staffProfile?.id);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<any>(null);
  const [bookingReportDialogOpen, setBookingReportDialogOpen] = useState(false);
  const [selectedVisitRecordId, setSelectedVisitRecordId] = useState<string | null>(null);
  const [pastSearchQuery, setPastSearchQuery] = useState('');

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
  
  // Derived state: Filter reports by status
  const { pendingReports, approvedReports, rejectedReports, revisionReports } = useMemo(() => {
    return {
      pendingReports: reports.filter(r => r.status === 'pending'),
      approvedReports: reports.filter(r => r.status === 'approved'),
      rejectedReports: reports.filter(r => r.status === 'rejected'),
      revisionReports: reports.filter(r => r.status === 'requires_revision')
    };
  }, [reports]);

  // Derived state: Past appointments with report status
  const pastAppointmentsWithReportStatus = useMemo(() => {
    // Filter past appointments (completed or done status, before current time)
    const pastAppointments = allBookings.filter(booking => {
      if (!booking.start_time) return false;
      try {
        const startTime = new Date(booking.start_time);
        return !isNaN(startTime.getTime()) && 
               (booking.status === 'done' || booking.status === 'completed') && 
               startTime < new Date();
      } catch (e) {
        console.warn('[CarerReportsTab] Invalid date for booking:', booking.id);
        return false;
      }
    });

    // Cross-reference with reports to get full report status
    // Always pick the LATEST report for each booking (by created_at desc)
    return pastAppointments.map(booking => {
      const bookingReports = reports
        .filter(r => r.booking_id === booking.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      const latestReport = bookingReports[0] || null;
      
      return {
        ...booking,
        has_report: !!latestReport,
        report: latestReport
      };
    });
  }, [allBookings, reports]);

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
  const isInitializing = contextLoading || !carerContext?.staffProfile?.id;
  
  if (isInitializing) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="ml-3 text-sm text-muted-foreground">
          {contextLoading ? 'Loading your profile...' : 'Initializing service reports...'}
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
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Service Reports</h3>
          <p className="text-sm text-muted-foreground">
            Manage your service reports and track their approval status
          </p>
        </div>
        
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{approvedReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{revisionReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Revision</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{rejectedReports.length}</p>
                <p className="text-xs text-muted-foreground truncate">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xl md:text-2xl font-bold">{pastAppointmentsWithReportStatus.length}</p>
                <p className="text-xs text-muted-foreground truncate">Past Appts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="past" className="w-full">
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-max min-w-full gap-1 p-1">
            <TabsTrigger value="past" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-[44px]">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Past</span>
              <span className="text-xs">({pastAppointmentsWithReportStatus.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-[44px]">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Pending</span>
              <span className="text-xs">({pendingReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="revision" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-[44px]">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Revision</span>
              <span className="text-xs">({revisionReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-[44px]">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Approved</span>
              <span className="text-xs">({approvedReports.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 min-w-[44px]">
              <XCircle className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Rejected</span>
              <span className="text-xs">({rejectedReports.length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="past" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Past Appointments
              </CardTitle>
              <CardDescription>
                View all your completed appointments and their service report status. Easily identify which appointments need reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by booking ID, client name, service, or date..."
                    value={pastSearchQuery}
                    onChange={(e) => setPastSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {pastSearchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setPastSearchQuery('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {pastSearchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing {filteredPastAppointments.length} of {pastAppointmentsWithReportStatus.length} appointments
                  </p>
                )}
              </div>

              {allBookingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pastAppointmentsWithReportStatus.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No past appointments</p>
                  <p className="text-sm">Your completed appointments will appear here.</p>
                </div>
              ) : filteredPastAppointments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No results found</p>
                  <p className="text-sm">No appointments match "{pastSearchQuery}"</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setPastSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Booking ID</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Report Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPastAppointments
                        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                        .map(booking => {
                          const startTime = new Date(booking.start_time);
                          const endTime = new Date(booking.end_time);
                          const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-mono text-xs">
                                #{booking.id.slice(0, 8)}
                              </TableCell>
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
                                {durationMinutes} min
                              </TableCell>
                              <TableCell>
                                <Badge variant="success" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {booking.has_report && booking.report ? (() => {
                                  const status = booking.report.status;
                                  switch (status) {
                                    case 'pending':
                                      return (
                                        <Badge variant="secondary" className="text-xs">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending Review
                                        </Badge>
                                      );
                                    case 'approved':
                                      return (
                                        <Badge variant="success" className="text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Approved
                                        </Badge>
                                      );
                                    case 'rejected':
                                      return (
                                        <Badge variant="destructive" className="text-xs">
                                          <XCircle className="h-3 w-3 mr-1" />
                                          Rejected
                                        </Badge>
                                      );
                                    case 'requires_revision':
                                      return (
                                        <Badge variant="warning" className="text-xs">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          Needs Revision
                                        </Badge>
                                      );
                                    default:
                                      return (
                                        <Badge variant="outline" className="text-xs">
                                          <ClipboardList className="h-3 w-3 mr-1" />
                                          Incomplete
                                        </Badge>
                                      );
                                  }
                                })() : (
                                  <Badge variant="warning" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Needs Report
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {!booking.has_report ? (
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
                                ) : (
                                  <div className="flex items-center gap-2 justify-end">
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      onClick={() => {
                                        const report = reports.find(r => r.booking_id === booking.id);
                                        if (report) {
                                          setSelectedReport(report);
                                          setViewDialogOpen(true);
                                        }
                                      }} 
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <Eye className="h-3 w-3" />
                                      View
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        const report = reports.find(r => r.booking_id === booking.id);
                                        if (report) {
                                          handleEditReport(report);
                                        }
                                      }} 
                                      className="flex items-center gap-1 text-xs"
                                    >
                                      <Edit className="h-3 w-3" />
                                      Edit
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? <EmptyState message="No pending reports" /> : pendingReports.map(report => <ReportCard key={report.id} report={report} canEdit={true} onEdit={() => handleEditReport(report)} />)}
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          {revisionReports.length === 0 ? <EmptyState message="No revision reports" /> : revisionReports.map(report => <ReportCard key={report.id} report={report} canEdit={true} onEdit={() => handleEditReport(report)} />)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReports.length === 0 ? <EmptyState message="No approved reports" /> : approvedReports.map(report => <ReportCard key={report.id} report={report} canEdit={true} onEdit={() => handleEditReport(report)} />)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedReports.length === 0 ? <EmptyState message="No rejected reports" /> : rejectedReports.map(report => <ReportCard key={report.id} report={report} canEdit={true} onEdit={() => handleEditReport(report)} />)}
        </TabsContent>
      </Tabs>

      {/* Create Report Dialog */}
      <CreateServiceReportDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Report Dialog */}
      {selectedReport && <CreateServiceReportDialog open={editDialogOpen} onOpenChange={open => {
      setEditDialogOpen(open);
      if (!open) setSelectedReport(null);
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
  onEdit
}: {
  report: any;
  canEdit?: boolean;
  onEdit?: () => void;
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
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
              <Badge variant="custom" className={getStatusColor(report.status)}>
                {getStatusIcon(report.status)}
                {report.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {report.clients?.first_name} {report.clients?.last_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {report.service_duration_minutes} minutes
              </span>
              <span className="text-xs text-muted-foreground">
                Submitted: {format(new Date(report.submitted_at), 'MMM d, h:mm a')}
              </span>
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {canEdit && onEdit && <Button onClick={onEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
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
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span>{report.client_mood}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{report.client_engagement}</span>
            </div>
            {report.incident_occurred && <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Incident</span>
              </div>}
            {report.medication_administered && <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Medication</span>
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