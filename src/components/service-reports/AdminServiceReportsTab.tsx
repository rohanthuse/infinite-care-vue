import React, { useState } from 'react';
import { useClientServiceReports } from '@/hooks/useServiceReports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateServiceReportDialog } from './CreateServiceReportDialog';
import { ViewServiceReportDialog } from './ViewServiceReportDialog';
import { Calendar, Clock, User, FileText, Activity, AlertTriangle, CheckCircle, XCircle, Eye, Edit, Download, MessageSquare, List } from 'lucide-react';
import { format } from 'date-fns';
import { ExportServiceReportsDialog } from './ExportServiceReportsDialog';
import { toast } from '@/hooks/use-toast';

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
  
  const [viewReportDialog, setViewReportDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });
  const [editReportDialog, setEditReportDialog] = useState<{
    open: boolean;
    report: any;
  }>({
    open: false,
    report: null
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);

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

  // Get reports for current month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthReports = reports.filter(r => new Date(r.service_date) >= thisMonthStart);

  const openViewDialog = (report: any) => {
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
      toast({
        title: 'Download in Progress',
        description: 'Please wait for the current download to complete.',
        variant: 'default',
      });
      return;
    }

    console.log('[handleDownloadPDF] Starting PDF generation for report:', report.id);
    setDownloadingReportId(report.id);

    try {
      const { generatePDFForServiceReport } = await import('@/utils/serviceReportPdfExporter');
      await generatePDFForServiceReport(report, report.branch_id);
      
      console.log('[handleDownloadPDF] ✅ PDF generated successfully for report:', report.id);
      toast({
        title: 'Success',
        description: 'Service report downloaded successfully',
      });
    } catch (error) {
      console.error('[handleDownloadPDF] ❌ PDF generation failed:', error);
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingReportId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Service Reports Management</h3>
          <p className="text-sm text-muted-foreground">
            View and manage service reports for this client
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

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            All Reports ({reports.length})
          </TabsTrigger>
          <TabsTrigger value="this-month" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            This Month ({thisMonthReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {reports.length === 0 ? (
            <EmptyState message="No service reports yet" />
          ) : (
            reports.map(report => (
              <ServiceReportCard 
                key={report.id} 
                report={report} 
                onView={() => openViewDialog(report)}
                onEdit={() => openEditDialog(report)}
                onDownload={() => handleDownloadPDF(report)} 
                isDownloading={downloadingReportId === report.id} 
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="this-month" className="space-y-4">
          {thisMonthReports.length === 0 ? (
            <EmptyState message="No service reports this month" />
          ) : (
            thisMonthReports.map(report => (
              <ServiceReportCard 
                key={report.id} 
                report={report} 
                onView={() => openViewDialog(report)}
                onEdit={() => openEditDialog(report)}
                onDownload={() => handleDownloadPDF(report)} 
                isDownloading={downloadingReportId === report.id} 
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* View Service Report Dialog */}
      {viewReportDialog.report && (
        <ViewServiceReportDialog
          open={viewReportDialog.open}
          onOpenChange={(open) => {
            setViewReportDialog({ open, report: open ? viewReportDialog.report : null });
          }}
        report={viewReportDialog.report}
        adminMode={true}
        />
      )}

      {/* Edit Report Dialog */}
      {editReportDialog.report && (
        <CreateServiceReportDialog
          open={editReportDialog.open}
          onOpenChange={(open) => setEditReportDialog({ open, report: open ? editReportDialog.report : null })}
          preSelectedClient={{
            id: editReportDialog.report.client_id,
            name: `${editReportDialog.report.clients?.first_name || ''} ${editReportDialog.report.clients?.last_name || ''}`.trim() || clientName
          }}
          preSelectedBooking={editReportDialog.report.visit_record_id ? {
            start_time: editReportDialog.report.service_date,
            end_time: editReportDialog.report.service_date,
            service_name: editReportDialog.report.services_provided?.[0] || 'Service'
          } : undefined}
          visitRecordId={editReportDialog.report.visit_record_id}
          existingReport={editReportDialog.report}
          mode="edit"
          adminMode={true}
          adminBranchId={branchId}
        />
      )}

      {/* Export Dialog */}
      <ExportServiceReportsDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        clientId={clientId}
        branchId={branchId}
        clientName={clientName}
      />
    </div>
  );
}

// Helper Components
function ServiceReportCard({
  report,
  onView,
  onEdit,
  onDownload,
  isDownloading = false,
}: {
  report: any;
  onView?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
  isDownloading?: boolean;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.service_date), 'EEEE, MMMM d, yyyy')}
              <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                APPROVED
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
              {report.submitted_at && (
                <span className="text-xs text-muted-foreground">
                  Created: {format(new Date(report.submitted_at), 'MMM d, h:mm a')}
                </span>
              )}
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            {onView && (
              <Button onClick={onView} size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View Report
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit} size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDownload && (
              <Button onClick={onDownload} size="sm" variant="outline" disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-1"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </>
                )}
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
            {report.client_mood && (
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>{report.client_mood}</span>
              </div>
            )}
            {report.client_engagement && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{report.client_engagement}</span>
              </div>
            )}
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
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  message
}: {
  message: string;
}) {
  return (
    <Card className="p-6">
      <div className="text-center text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2" />
        <p>{message}</p>
      </div>
    </Card>
  );
}
