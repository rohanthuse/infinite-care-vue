import React, { useState } from 'react';
import { usePendingServiceReports, useReviewServiceReport } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle,
  Calendar, 
  Clock, 
  User, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PendingReportsAdminProps {
  branchId: string;
}

export function PendingReportsAdmin({ branchId }: PendingReportsAdminProps) {
  const { data: pendingReports = [], isLoading, error } = usePendingServiceReports(branchId);
  const reviewReport = useReviewServiceReport();
  
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; report: any }>({ 
    open: false, 
    report: null 
  });
  const [reviewNotes, setReviewNotes] = useState('');
  const [visibleToClient, setVisibleToClient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = (report: any, status: 'approved' | 'rejected' | 'requires_revision') => {
    console.log('[handleReview] Called with:', { reportId: report?.id, status });
    
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
      onSuccess: (data) => {
        console.log('[handleReview] Success:', data);
        setReviewDialog({ open: false, report: null });
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

  // Reset state when dialog closes
  React.useEffect(() => {
    if (!reviewDialog.open) {
      setIsSubmitting(false);
      setReviewNotes('');
      setVisibleToClient(true);
    }
  }, [reviewDialog.open]);

  const openReviewDialog = (report: any) => {
    setReviewDialog({ open: true, report });
    setReviewNotes('');
    setVisibleToClient(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load pending reports</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Pending Service Reports
          </h3>
          <p className="text-sm text-muted-foreground">
            Review and approve service reports submitted by carers
          </p>
        </div>
        <Badge variant="secondary">
          {pendingReports.length} Pending
        </Badge>
      </div>

      {/* Reports List */}
      {pendingReports.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2" />
              <p>No pending reports to review</p>
              <p className="text-sm">New reports will appear here when submitted by carers.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200" variant="outline">
                        PENDING REVIEW
                      </Badge>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Carer: {report.staff?.first_name} {report.staff?.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Client: {report.clients?.first_name} {report.clients?.last_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {report.service_duration_minutes} minutes
                      </span>
                    </CardDescription>
                  </div>
                  
                  <Button onClick={() => openReviewDialog(report)} size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Review
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Services Preview */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Services Provided:</h4>
                    <div className="flex flex-wrap gap-1">
                      {report.services_provided?.slice(0, 4).map((service: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                      {report.services_provided?.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{report.services_provided.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Key Information */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                      <span>Mood: {report.client_mood}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Engagement: {report.client_engagement}</span>
                    </div>
                    {report.medication_administered && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                        <span>Medication given</span>
                      </div>
                    )}
                    {report.incident_occurred && (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span>Incident reported</span>
                      </div>
                    )}
                  </div>

                  {/* Carer Observations Preview */}
                  {report.carer_observations && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">Carer Observations:</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {report.carer_observations}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Submitted: {format(new Date(report.submitted_at), 'MMM d, yyyy at h:mm a')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialog.open} 
        onOpenChange={(open) => {
          if (!open && (isSubmitting || reviewReport.isPending)) {
            console.warn('Cannot close dialog while submitting');
            return;
          }
          setReviewDialog({ open, report: null });
          setReviewNotes('');
          setVisibleToClient(true);
          setIsSubmitting(false);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto relative">
          {(isSubmitting || reviewReport.isPending) && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm font-medium">Processing review...</p>
              </div>
            </div>
          )}
          
          <DialogHeader>
            <DialogTitle>Review Service Report</DialogTitle>
            <DialogDescription>
              Review the service report and approve, reject, or request revisions.
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.report && (
            <div className="space-y-6">
              {/* Report Details */}
              <ScrollArea className="max-h-[50vh]">
                <ServiceReportDetails report={reviewDialog.report} />
              </ScrollArea>
              
              <Separator />
              
              {/* Review Form */}
              <div className="space-y-4">
                <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add any notes about this review decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visibleToClient"
                    checked={visibleToClient}
                    onCheckedChange={(checked) => setVisibleToClient(checked === true)}
                  />
                  <Label htmlFor="visibleToClient">
                    Make visible to client when approved
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setReviewDialog({ open: false, report: null });
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
                  handleReview(reviewDialog.report, 'rejected');
                }
              }}
              disabled={isSubmitting || reviewReport.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {(isSubmitting || reviewReport.isPending) ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
                  handleReview(reviewDialog.report, 'requires_revision');
                }
              }}
              disabled={isSubmitting || reviewReport.isPending}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {(isSubmitting || reviewReport.isPending) ? 'Processing...' : 'Request Revision'}
            </Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (reviewDialog.report && !isSubmitting && !reviewReport.isPending) {
                  handleReview(reviewDialog.report, 'approved');
                }
              }}
              disabled={isSubmitting || reviewReport.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {(isSubmitting || reviewReport.isPending) ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Service Report Details Component
function ServiceReportDetails({ report }: { report: any }) {
  return (
    <div className="space-y-4">
      {/* Header Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
          <div>
            <span className="font-medium">Client:</span>
            <p>{report.clients?.first_name} {report.clients?.last_name}</p>
          </div>
      </div>

      <Separator />

      {/* Services Provided */}
      <div>
        <h4 className="font-medium mb-2">Services Provided</h4>
        <div className="flex flex-wrap gap-2">
          {report.services_provided?.map((service: string, index: number) => (
            <Badge key={index} variant="secondary">
              {service}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tasks Completed */}
      {report.tasks_completed && report.tasks_completed.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Tasks Completed</h4>
          <div className="flex flex-wrap gap-2">
            {report.tasks_completed.map((task: string, index: number) => (
              <Badge key={index} variant="outline">
                {task}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Client Assessment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Client Mood</h4>
          <p className="text-sm text-muted-foreground">{report.client_mood}</p>
        </div>
        <div>
          <h4 className="font-medium mb-2">Engagement Level</h4>
          <p className="text-sm text-muted-foreground">{report.client_engagement}</p>
        </div>
      </div>

      {/* Activities */}
      {report.activities_undertaken && (
        <div>
          <h4 className="font-medium mb-2">Activities Undertaken</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.activities_undertaken}
          </p>
        </div>
      )}

      {/* Medication */}
      {report.medication_administered && (
        <div className="space-y-3">
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
        </div>
      )}

      {/* Incidents */}
      {report.incident_occurred && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <h4 className="font-medium mb-1 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            Incident Report
          </h4>
          {report.incident_details && (
            <p className="text-sm text-amber-700 whitespace-pre-wrap">
              {report.incident_details}
            </p>
          )}
        </div>
      )}

      {/* Observations */}
      <div>
        <h4 className="font-medium mb-2">Carer Observations</h4>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {report.carer_observations}
        </p>
      </div>

      {/* Client Feedback */}
      {report.client_feedback && (
        <div>
          <h4 className="font-medium mb-2">Client Feedback</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.client_feedback}
          </p>
        </div>
      )}

      {/* Next Visit Preparations */}
      {report.next_visit_preparations && (
        <div>
          <h4 className="font-medium mb-2">Next Visit Preparations</h4>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {report.next_visit_preparations}
          </p>
        </div>
      )}

      <Separator />
      
      {/* Submission Info */}
      <div className="text-xs text-muted-foreground">
        <p>Submitted: {format(new Date(report.submitted_at), 'PPpp')}</p>
      </div>
    </div>
  );
}