import React, { useState } from 'react';
import { useClientServiceReports, useReviewServiceReport } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminServiceReportForm } from './AdminServiceReportForm';
import { Calendar, Clock, User, FileText, Activity, AlertTriangle, CheckCircle, XCircle, Eye, ThumbsUp, ThumbsDown, AlertCircle, MessageSquare, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
interface AdminServiceReportsTabProps {
  clientId: string;
  branchId: string;
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
  clients = [],
  staff = []
}: AdminServiceReportsTabProps) {
  const {
    data: reports = [],
    isLoading,
    error
  } = useClientServiceReports(clientId);
  const reviewReport = useReviewServiceReport();
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });
  const [reviewNotes, setReviewNotes] = useState('');
  const [visibleToClient, setVisibleToClient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createReportOpen, setCreateReportOpen] = useState(false);
  const [editReportDialog, setEditReportDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });

  // Reset state when dialog closes - MUST be before any conditional returns
  React.useEffect(() => {
    if (!reviewDialog.open) {
      setIsSubmitting(false);
      setReviewNotes('');
      setVisibleToClient(true);
    }
  }, [reviewDialog.open]);
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
  const handleReview = (report: any, status: 'approved' | 'rejected' | 'requires_revision') => {
    console.log('[handleReview] Called with:', {
      reportId: report?.id,
      status
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
      reviewNotes: reviewNotes || undefined,
      visibleToClient: status === 'approved' ? visibleToClient : false
    }, {
      onSuccess: data => {
        console.log('[handleReview] Success:', data);
        setReviewDialog({
          open: false,
          report: null
        });
        setReviewNotes('');
        setVisibleToClient(true);
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
    setReviewDialog({
      open: true,
      report
    });
    setReviewNotes('');
    setVisibleToClient(true);
  };
  const openEditDialog = (report: any) => {
    setEditReportDialog({
      open: true,
      report
    });
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
          {approvedReports.length === 0 ? <EmptyState message="No approved reports" /> : approvedReports.map(report => <ServiceReportCard key={report.id} report={report} onEdit={() => openEditDialog(report)} showEditButton />)}
        </TabsContent>

        <TabsContent value="revision" className="space-y-4">
          {revisionReports.length === 0 ? <EmptyState message="No reports requiring revision" /> : revisionReports.map(report => <ServiceReportCard key={report.id} report={report} onReview={() => openReviewDialog(report)} onEdit={() => openEditDialog(report)} showReviewButtons showEditButton />)}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedReports.length === 0 ? <EmptyState message="No rejected reports" /> : rejectedReports.map(report => <ServiceReportCard key={report.id} report={report} onEdit={() => openEditDialog(report)} showEditButton />)}
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={open => {
      if (!open && (isSubmitting || reviewReport.isPending)) {
        console.warn('Cannot close dialog while submitting');
        return;
      }
      setReviewDialog({
        open,
        report: null
      });
      setReviewNotes('');
      setVisibleToClient(true);
      setIsSubmitting(false);
    }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {(isSubmitting || reviewReport.isPending) && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm font-medium">Processing review...</p>
              </div>
            </div>}
          
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Review Service Report</DialogTitle>
            <DialogDescription>
              Review and approve/reject the service report submitted by the carer.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            {reviewDialog.report && <div className="space-y-6 pr-2">
                <ServiceReportDetails report={reviewDialog.report} />
                
                <Separator />
                
                <div className="space-y-4">
                  <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                  <Textarea id="reviewNotes" placeholder="Add any notes about this review decision..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} />
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox id="visibleToClient" checked={visibleToClient} onCheckedChange={checked => setVisibleToClient(checked === true)} />
                    <Label htmlFor="visibleToClient">
                      Make visible to client when approved
                    </Label>
                  </div>
                </div>
              </div>}
          </div>

          <DialogFooter className="flex-shrink-0 gap-2 pt-4">
            <Button type="button" variant="outline" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setReviewDialog({
              open: false,
              report: null
            });
          }}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
              handleReview(reviewDialog.report, 'rejected');
            }
          }} disabled={isSubmitting || reviewReport.isPending}>
              <XCircle className="h-4 w-4 mr-2" />
              {isSubmitting || reviewReport.isPending ? 'Processing...' : 'Reject'}
            </Button>
            <Button type="button" variant="outline" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
              handleReview(reviewDialog.report, 'requires_revision');
            }
          }} disabled={isSubmitting || reviewReport.isPending}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              {isSubmitting || reviewReport.isPending ? 'Processing...' : 'Request Revision'}
            </Button>
            <Button type="button" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
              handleReview(reviewDialog.report, 'approved');
            }
          }} disabled={isSubmitting || reviewReport.isPending}>
              <CheckCircle className="h-4 w-4 mr-2" />
              {isSubmitting || reviewReport.isPending ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </div>;
}

// Helper Components
function ServiceReportCard({
  report,
  onReview,
  onEdit,
  showReviewButtons = false,
  showEditButton = false
}: {
  report: any;
  onReview?: () => void;
  onEdit?: () => void;
  showReviewButtons?: boolean;
  showEditButton?: boolean;
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
          
          <div className="flex gap-2">
            {showEditButton && onEdit && <Button onClick={onEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>}
            {showReviewButtons && onReview && <Button onClick={onReview} size="sm">
                <Eye className="h-4 w-4 mr-1" />
                Review
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

        {report.medication_administered && <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-1 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              Medication Administered
            </h4>
            {report.medication_notes && <p className="text-sm text-blue-700">{report.medication_notes}</p>}
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