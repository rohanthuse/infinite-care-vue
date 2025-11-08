import React, { useState } from 'react';
import { useCarerServiceReports } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
import { useCarerCompletedBookings } from '@/hooks/useCarerCompletedBookings';
import { useCarerBookings } from '@/hooks/useCarerBookings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreateServiceReportDialog } from '../service-reports/CreateServiceReportDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Edit,
  Eye,
  Calendar,
  User,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';

export function CarerReportsTab() {
  const { data: carerContext } = useCarerContext();
  const { data: reports = [], isLoading, error } = useCarerServiceReports(carerContext?.staffProfile?.id);
  const { data: completedBookings = [], isLoading: bookingsLoading } = useCarerCompletedBookings(
    carerContext?.staffProfile?.id
  );
  const { data: allBookings = [], isLoading: allBookingsLoading } = useCarerBookings(
    carerContext?.staffProfile?.id
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedBookingForReport, setSelectedBookingForReport] = useState<any>(null);
  const [bookingReportDialogOpen, setBookingReportDialogOpen] = useState(false);

  // Debug logging
  console.log('[CarerReportsTab] Carer context:', {
    hasContext: !!carerContext,
    hasStaffProfile: !!carerContext?.staffProfile,
    staffId: carerContext?.staffProfile?.id,
    bookingsLoading,
    completedBookingsCount: completedBookings.length
  });

  if (!carerContext?.staffProfile) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>Unable to load carer profile</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <XCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load service reports</p>
        </div>
      </Card>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending');
  const approvedReports = reports.filter(r => r.status === 'approved');
  const rejectedReports = reports.filter(r => r.status === 'rejected');
  const revisionReports = reports.filter(r => r.status === 'requires_revision');
  
  // Filter past appointments (completed or done status, before current time)
  const pastAppointments = allBookings.filter(booking => {
    const startTime = new Date(booking.start_time);
    return (booking.status === 'done' || booking.status === 'completed') && startTime < new Date();
  });
  
  // Cross-reference with reports to check which appointments have reports
  const pastAppointmentsWithReportStatus = pastAppointments.map(booking => {
    const hasReport = reports.some(report => report.booking_id === booking.id);
    return { ...booking, has_report: hasReport };
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_revision': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'requires_revision': return <AlertTriangle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const handleEditReport = (report: any) => {
    setSelectedReport(report);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">My Service Reports</h3>
          <p className="text-sm text-muted-foreground">
            Manage your service reports and track their approval status
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{completedBookings.length}</p>
                <p className="text-xs text-muted-foreground">Need Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingReports.length}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{approvedReports.length}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{revisionReports.length}</p>
                <p className="text-xs text-muted-foreground">Need Revision</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{rejectedReports.length}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{pastAppointments.length}</p>
                <p className="text-xs text-muted-foreground">Past Appointments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="completed" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Completed ({completedBookings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Revision ({revisionReports.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedReports.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedReports.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Completed Appointments Without Reports
              </CardTitle>
              <CardDescription>
                Create service reports for your completed appointments. Reports help maintain quality records of care provided.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bookingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : completedBookings.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-lg font-medium">All caught up!</p>
                  <p className="text-sm">All your completed appointments have service reports.</p>
                  
                  {/* Debug info */}
                  <div className="mt-4 p-4 bg-muted rounded-md text-left text-xs max-w-md mx-auto">
                    <p className="font-semibold mb-2">Debug Information:</p>
                    <div className="font-mono space-y-1">
                      <p>Carer ID: {carerContext?.staffProfile?.id || 'NOT SET'}</p>
                      <p>Has Context: {String(!!carerContext)}</p>
                      <p>Has Staff Profile: {String(!!carerContext?.staffProfile)}</p>
                      <p>Bookings Loading: {String(bookingsLoading)}</p>
                      <p className="text-muted-foreground mt-2 text-xs">
                        Check console logs for detailed query results
                      </p>
                    </div>
                  </div>
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
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedBookings.map((booking) => {
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
                                {booking.clients?.first_name} {booking.clients?.last_name}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {booking.services?.title || 'General Service'}
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
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? (
            <EmptyState message="No pending reports" />
          ) : (
            pendingReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                canEdit={false}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          {revisionReports.length === 0 ? (
            <EmptyState message="No reports requiring revision" />
          ) : (
            revisionReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                canEdit={true}
                onEdit={() => handleEditReport(report)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReports.length === 0 ? (
            <EmptyState message="No approved reports" />
          ) : (
            approvedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedReports.length === 0 ? (
            <EmptyState message="No rejected reports" />
          ) : (
            rejectedReports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))
          )}
        </TabsContent>

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
              {allBookingsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : pastAppointments.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-lg font-medium">No past appointments</p>
                  <p className="text-sm">Your completed appointments will appear here.</p>
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
                      {pastAppointmentsWithReportStatus
                        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                        .map((booking) => {
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
                                {booking.has_report ? (
                                  <Badge variant="success" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Has Report
                                  </Badge>
                                ) : (
                                  <Badge variant="warning" className="text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Needs Report
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {booking.has_report ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const report = reports.find(r => r.booking_id === booking.id);
                                      if (report) {
                                        setSelectedReport(report);
                                        setEditDialogOpen(true);
                                      }
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Report
                                  </Button>
                                ) : (
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
      </Tabs>

      {/* Create Report Dialog */}
      <CreateServiceReportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Edit Report Dialog */}
      {selectedReport && (
        <CreateServiceReportDialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open);
            if (!open) setSelectedReport(null);
          }}
          preSelectedClient={{
            id: selectedReport.client_id,
            name: `${selectedReport.clients?.first_name} ${selectedReport.clients?.last_name}`
          }}
          preSelectedDate={selectedReport.service_date}
          bookingId={selectedReport.booking_id}
        />
      )}

      {/* Create Report from Booking Dialog */}
      {selectedBookingForReport && (
        <CreateServiceReportDialog
          open={bookingReportDialogOpen}
          onOpenChange={(open) => {
            setBookingReportDialogOpen(open);
            if (!open) setSelectedBookingForReport(null);
          }}
          preSelectedClient={{
            id: selectedBookingForReport.client_id,
            name: `${selectedBookingForReport.clients?.first_name} ${selectedBookingForReport.clients?.last_name}`
          }}
          preSelectedDate={format(new Date(selectedBookingForReport.start_time), 'yyyy-MM-dd')}
          bookingId={selectedBookingForReport.id}
        />
      )}
    </div>
  );
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'requires_revision': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'requires_revision': return <AlertTriangle className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
              <Badge className={getStatusColor(report.status)} variant="outline">
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
            {canEdit && onEdit && (
              <Button onClick={onEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Services Preview */}
          <div>
            <div className="flex flex-wrap gap-1">
              {report.services_provided?.slice(0, 3).map((service: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>
              ))}
              {report.services_provided?.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{report.services_provided.length - 3} more
                </Badge>
              )}
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
            {report.incident_occurred && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Incident</span>
              </div>
            )}
            {report.medication_administered && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-blue-500" />
                <span>Medication</span>
              </div>
            )}
          </div>

          {/* Review notes if any */}
          {report.review_notes && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Admin Feedback:</span>
              </div>
              <p className="text-sm text-muted-foreground">{report.review_notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="p-6">
      <div className="text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p>{message}</p>
      </div>
    </Card>
  );
}