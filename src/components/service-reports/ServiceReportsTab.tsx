import React, { useState, useEffect, memo } from 'react';
import { useApprovedServiceReports } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Share2
} from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UnifiedShareDialog } from '@/components/sharing/UnifiedShareDialog';

interface ServiceReportsTabProps {
  clientId: string;
  branchId?: string;
}

export const ServiceReportsTab = memo(function ServiceReportsTab({ clientId, branchId }: ServiceReportsTabProps) {
  const { data: reports = [], isLoading, error } = useApprovedServiceReports(clientId);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportToShare, setReportToShare] = useState<any>(null);

  const handleGenerateReportPDF = async (report: any): Promise<Blob> => {
    const content = `Service Report - ${format(new Date(report.service_date), 'MMMM d, yyyy')}
    
Carer: ${report.staff?.first_name} ${report.staff?.last_name}
Duration: ${report.service_duration_minutes} minutes

Services Provided:
${report.services_provided?.join(', ') || 'N/A'}

Tasks Completed:
${report.tasks_completed?.join(', ') || 'N/A'}

Client Mood: ${report.client_mood}
Client Engagement: ${report.client_engagement}

Activities Undertaken:
${report.activities_undertaken || 'N/A'}

${report.medication_administered ? 'Medication Administered:\n' + (report.medication_notes || 'Yes') : ''}

${report.incident_occurred ? 'Incident Occurred:\n' + (report.incident_details || 'Yes') : ''}

Carer Observations:
${report.carer_observations || 'N/A'}

${report.client_feedback ? 'Client Feedback:\n' + report.client_feedback : ''}

${report.next_visit_preparations ? 'Next Visit Preparations:\n' + report.next_visit_preparations : ''}`;

    return new Blob([content], { type: 'text/plain' });
  };

  useEffect(() => {
    console.log('[ServiceReportsTab] Component mounted/updated', { clientId, reportsCount: reports?.length });
    
    return () => {
      console.log('[ServiceReportsTab] Component unmounting');
    };
  }, [clientId, reports?.length]);

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

  if (reports.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2" />
          <p>No service reports available yet</p>
          <p className="text-sm">Reports will appear here after they are completed and approved by your care team.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Reports</h3>
          <p className="text-sm text-muted-foreground">
            Records of care services provided to you
          </p>
        </div>
        <Badge variant="secondary">
          {reports.length} Report{reports.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
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
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Service Report - {format(new Date(report.service_date), 'MMMM d, yyyy')}</DialogTitle>
                      <DialogDescription>
                        Care services provided by {report.staff?.first_name} {report.staff?.last_name}
                      </DialogDescription>
                    </DialogHeader>
                    <ServiceReportDetails report={report} />
                  </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReportToShare(report);
                      setShareDialogOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Services Provided */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Services Provided:</h4>
                  <div className="flex flex-wrap gap-1">
                    {report.services_provided?.map((service: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Key Information */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span>Mood: {report.client_mood}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Engagement: {report.client_engagement}</span>
                  </div>
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
                    <h4 className="text-sm font-medium mb-1">Carer Notes:</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {report.carer_observations}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Share Dialog */}
      <UnifiedShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        contentId={reportToShare?.id || ''}
        contentType="report"
        contentTitle={`Service Report - ${reportToShare ? format(new Date(reportToShare.service_date), 'MMM d, yyyy') : ''}`}
        branchId={branchId || ''}
        onGeneratePDF={async () => await handleGenerateReportPDF(reportToShare)}
        reportType="service"
        reportData={reportToShare}
      />
    </div>
  );
});

// Component for detailed view of service report
const ServiceReportDetails = memo(function ServiceReportDetails({ report }: { report: any }) {
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Service Date</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Duration</h4>
            <p className="text-sm text-muted-foreground">
              {report.service_duration_minutes} minutes
            </p>
          </div>
        </div>

        <Separator />

        {/* Services Provided */}
        <div>
          <h4 className="font-medium mb-3">Services Provided</h4>
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
            <h4 className="font-medium mb-3">Specific Tasks Completed</h4>
            <div className="flex flex-wrap gap-2">
              {report.tasks_completed.map((task: string, index: number) => (
                <Badge key={index} variant="outline">
                  {task}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Assessment */}
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
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Medication Administration
            </h4>
            
            {report.medication_notes && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-blue-700 font-medium mb-1">Summary:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {report.medication_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Incidents */}
        {report.incident_occurred && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2 text-amber-800">
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

        <Separator />

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

        {/* Report Meta */}
        <Separator />
        <div className="text-xs text-muted-foreground">
          <p>Report submitted: {format(new Date(report.submitted_at), 'PPpp')}</p>
          {report.reviewed_at && (
            <p>Approved: {format(new Date(report.reviewed_at), 'PPpp')}</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
});