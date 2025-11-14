import React, { useState } from 'react';
import { useClientServiceReports, useReviewServiceReport } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminServiceReportForm } from './AdminServiceReportForm';
import { ViewServiceReportDialog } from './ViewServiceReportDialog';
import { Calendar, Clock, User, FileText, Activity, AlertTriangle, CheckCircle, XCircle, Eye, Plus, Edit, Download, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ExportServiceReportsDialog } from './ExportServiceReportsDialog';
import { exportSingleServiceReportPDF } from '@/utils/serviceReportPdfExporter';
import { supabase } from '@/integrations/supabase/client';
interface AdminServiceReportsTabProps {
  clientId: string;
  branchId: string;
  clientName?: string;
  clients?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
  staff?: Array<{
    id: string;
    first_name: string;
    last_name: string;
  }>;
}
export function AdminServiceReportsTab({
  clientId,
  branchId,
  clientName = "Client",
  clients = [],
  staff = []
}: AdminServiceReportsTabProps) {
  const {
    data: reports = [],
    isLoading,
    error
  } = useClientServiceReports(clientId);
  const reviewReport = useReviewServiceReport();
  const [viewReportDialog, setViewReportDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [editReportDialog, setEditReportDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

  // Reset state when dialog closes - MUST be before any conditional returns
  React.useEffect(() => {
    if (!viewReportDialog.open) {
      setIsSubmitting(false);
    }
  }, [viewReportDialog.open]);
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (error) {
    return <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <XCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Failed to load service reports</p>
        </div>
      </Card>;
  }
  const pendingReports = reports.filter(r => r.status === 'pending');
  const approvedReports = reports.filter(r => r.status === 'approved');
  const rejectedReports = reports.filter(r => r.status === 'rejected');
  const revisionReports = reports.filter(r => r.status === 'requires_revision');
  const handleReview = async (
    report: any, 
    status: 'approved' | 'rejected' | 'requires_revision',
    notes: string,
    visibleToClient: boolean
  ) => {
    console.log('[handleReview] Called with:', {
      reportId: report?.id,
      status,
      notes,
      visibleToClient
    });

    // Safety check
    if (!report || !report.id) {
      console.error('[handleReview] Invalid report data:', report);
      return;
    }

    // Prevent multiple simultaneous calls with local lock
    if (isSubmitting || reviewReport.isPending) {
      console.warn('[handleReview] Already submitting, ignoring click');
      return;
    }

    // Set local lock immediately
    setIsSubmitting(true);
    console.log('[handleReview] Lock acquired, starting mutation');
    reviewReport.mutate({
      id: report.id,
      status,
      reviewNotes: notes || undefined,
      visibleToClient: status === 'approved' ? visibleToClient : false
    }, {
      onSuccess: data => {
        console.log('[handleReview] Success:', data);
        setViewReportDialog({
          open: false,
          report: null
        });
        setIsSubmitting(false);
      },
      onError: (error: any) => {
        console.error('[handleReview] Error:', error);
        setIsSubmitting(false);
      },
      onSettled: () => {
        console.log('[handleReview] Settled, releasing lock');
        setIsSubmitting(false);
      }
    });
  };
  const openReviewDialog = (report: any) => {
    setViewReportDialog({
      open: true,
      report
    });
  };
  const openEditDialog = (report: any) => {
    setEditReportDialog({
      open: true,
      report
    });
  };

  const handleDownloadPDF = async (report: any) => {
    // Prevent multiple simultaneous downloads
    if (downloadingReportId) {
      console.warn('Already downloading a report');
      return;
    }

    // Check if report has visit_record_id
    if (!report.visit_record_id) {
      console.error('No visit_record_id found in report');
      return;
    }

    setDownloadingReportId(report.id);

    try {
      // Fetch visit record
      const { data: visitRecord, error: visitError } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', report.visit_record_id)
        .single();

      if (visitError) throw visitError;

      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // Fetch medications
      const { data: medications, error: medsError } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .order('scheduled_time', { ascending: true });

      if (medsError) throw medsError;

      // Fetch vitals (including NEWS2)
      const { data: vitals, error: vitalsError } = await supabase
        .from('visit_vitals')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .order('recorded_at', { ascending: true });

      if (vitalsError) throw vitalsError;

      const news2Readings = vitals?.filter(v => v.vital_type === 'news2') || [];
      const otherVitals = vitals?.filter(v => v.vital_type !== 'news2') || [];

      // Fetch events
      const { data: events, error: eventsError } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .eq('event_type', 'general')
        .order('event_time', { ascending: true });

      if (eventsError) throw eventsError;

      // Fetch incidents
      const { data: incidents, error: incidentsError } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .eq('event_type', 'incident')
        .order('event_time', { ascending: true });

      if (incidentsError) throw incidentsError;

      // Fetch accidents
      const { data: accidents, error: accidentsError } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .eq('event_type', 'accident')
        .order('event_time', { ascending: true });

      if (accidentsError) throw accidentsError;

      // Fetch observations
      const { data: observations, error: observationsError } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', report.visit_record_id)
        .eq('event_type', 'observation')
        .order('event_time', { ascending: true });

      if (observationsError) throw observationsError;

      // Generate PDF
      await exportSingleServiceReportPDF({
        report: report,
        visitRecord: visitRecord,
        tasks: tasks || [],
        medications: medications || [],
        news2Readings: news2Readings || [],
        otherVitals: otherVitals || [],
        events: events || [],
        incidents: incidents || [],
        accidents: accidents || [],
        observations: observations || [],
        branchId: report.branch_id,
      });

      console.log('PDF generated successfully for report:', report.id);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloadingReportId(null);
    }
  };
  return <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Reports Management</h3>
          <p className="text-sm text-muted-foreground">
            Review and manage service reports for this client
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setExportDialogOpen(true)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Service Reports
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending ({pendingReports.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedReports.length})
          </TabsTrigger>
          <TabsTrigger value="revision" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Needs Revision ({revisionReports.length})
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingReports.length === 0 ? <EmptyState message="No pending reports" /> : pendingReports.map(report => <ServiceReportCard key={report.id} report={report} onReview={() => openReviewDialog(report)} showReviewButtons />)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedReports.length === 0 ? <EmptyState message="No approved reports" /> : approvedReports.map(report => <ServiceReportCard key={report.id} report={report} onEdit={() => openEditDialog(report)} onDownload={() => handleDownloadPDF(report)} showEditButton showDownloadButton isDownloading={downloadingReportId === report.id} />)}
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          {revisionReports.length === 0 ? <EmptyState message="No reports requiring revision" /> : revisionReports.map(report => <ServiceReportCard key={report.id} report={report} onReview={() => openReviewDialog(report)} onEdit={() => openEditDialog(report)} showReviewButtons showEditButton />)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedReports.length === 0 ? <EmptyState message="No rejected reports" /> : rejectedReports.map(report => <ServiceReportCard key={report.id} report={report} onEdit={() => openEditDialog(report)} showEditButton />)}
        </TabsContent>
      </Tabs>

      {/* View/Review Service Report Dialog */}
      {viewReportDialog.report && (
        <ViewServiceReportDialog
          open={viewReportDialog.open}
          onOpenChange={(open) => {
            setViewReportDialog({ open, report: open ? viewReportDialog.report : null });
          }}
          report={viewReportDialog.report}
          adminMode={true}
          onAdminReview={async (status, notes, visibleToClient) => {
            await handleReview(viewReportDialog.report, status, notes, visibleToClient);
          }}
        />
      )}

      {/* Create Report Dialog */}
      <AdminServiceReportForm open={createReportOpen} onOpenChange={setCreateReportOpen} branchId={branchId} clients={clients.length > 0 ? clients : [{
      id: clientId,
      first_name: 'Selected',
      last_name: 'Client'
    }]} staff={staff} mode="create" />

      {/* Edit Report Dialog */}
      <AdminServiceReportForm open={editReportDialog.open} onOpenChange={open => setEditReportDialog({
      open,
      report: null
    })} branchId={branchId} clients={clients.length > 0 ? clients : [{
      id: clientId,
      first_name: 'Selected',
      last_name: 'Client'
    }]} staff={staff} existingReport={editReportDialog.report} mode="edit" />

      {/* Export Dialog */}
      <ExportServiceReportsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        clientId={clientId}
        branchId={branchId}
        clientName={clientName}
      />
    </div>;
}

// Helper Components
function ServiceReportCard({
  report,
  onReview,
  onEdit,
  onDownload,
  showReviewButtons = false,
  showEditButton = false,
  showDownloadButton = false,
  isDownloading = false,
}: {
  report: any;
  onReview?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  showReviewButtons?: boolean;
  showEditButton?: boolean;
  showDownloadButton?: boolean;
  isDownloading?: boolean;
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
  return <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
              <Badge className={getStatusColor(report.status)} variant="outline">
                {report.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
            <CardDescription className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {report.staff?.first_name} {report.staff?.last_name}
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
          
          <div className="flex flex-col gap-2">
            {showEditButton && onEdit && <Button onClick={onEdit} size="sm" variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>}
            
            {showDownloadButton && onDownload && <Button onClick={onDownload} size="sm" variant="outline" disabled={isDownloading} className="w-full">
                {isDownloading ? <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1"></div>
                    Generating...
                  </> : <>
                    <Download className="h-4 w-4 mr-1" />
                    Download PDF
                  </>}
              </Button>}
            
            {showReviewButtons && onReview && <Button onClick={onReview} size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-1" />
                View & Review
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
              <Activity className="h-4 w-4 text-blue-500" />
              <span>{report.client_mood}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
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
          {report.review_notes && <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Review Notes:</span>
              </div>
              <p className="text-sm text-muted-foreground">{report.review_notes}</p>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
function ServiceReportDetails({
  report
}: {
  report: any;
}) {
  return <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Date:</span>
            <p>{format(new Date(report.service_date), 'MMM d, yyyy')}</p>
          </div>
          <div>
            <span className="font-medium">Duration:</span>
            <p>{report.service_duration_minutes} minutes</p>
          </div>
          <div>
            <span className="font-medium">Carer:</span>
            <p>{report.staff?.first_name} {report.staff?.last_name}</p>
          </div>
        </div>

        <Separator />

        {/* Services and Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Services Provided</h4>
            <div className="flex flex-wrap gap-1">
              {report.services_provided?.map((service: string, index: number) => <Badge key={index} variant="outline" className="text-xs">
                  {service}
                </Badge>)}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Client Assessment</h4>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Mood:</span> {report.client_mood}</p>
              <p><span className="font-medium">Engagement:</span> {report.client_engagement}</p>
            </div>
          </div>
        </div>

        {/* Carer Observations */}
        <div>
          <h4 className="font-medium mb-2">Carer Observations</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.carer_observations}
          </p>
        </div>

        {/* Additional sections if present */}
        {report.activities_undertaken && <div>
            <h4 className="font-medium mb-2">Activities</h4>
            <p className="text-sm text-muted-foreground">
              {report.activities_undertaken}
            </p>
          </div>}


        {report.medication_administered && <div className="space-y-3">
            <h4 className="font-medium text-sm text-blue-900 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Medication Administration
            </h4>
            
            {report.medication_notes && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700 font-medium mb-1">Summary:</p>
                <p className="text-sm text-blue-900 whitespace-pre-wrap">
                  {report.medication_notes}
                </p>
              </div>
            )}
          </div>}

        {report.incident_occurred && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium mb-1 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Incident Reported
            </h4>
            {report.incident_details && <p className="text-sm text-amber-700">{report.incident_details}</p>}
          </div>}
      </div>;
}
function EmptyState({
  message
}: {
  message: string;
}) {
  return <Card className="p-6">
      <div className="text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p>{message}</p>
      </div>
    </Card>;
}