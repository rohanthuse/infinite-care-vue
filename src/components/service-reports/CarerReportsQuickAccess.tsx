import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateServiceReportDialog } from './CreateServiceReportDialog';
import { useCarerServiceReports } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Edit,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface CarerReportsQuickAccessProps {
  bookingId?: string;
  clientId?: string;
  clientName?: string;
  serviceDate?: string;
}

export function CarerReportsQuickAccess({ 
  bookingId, 
  clientId, 
  clientName, 
  serviceDate 
}: CarerReportsQuickAccessProps) {
  const { data: carerContext } = useCarerContext();
  const { data: reports = [], isLoading } = useCarerServiceReports(carerContext?.staffProfile?.id);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (!carerContext?.staffProfile) {
    return null;
  }

  const recentReports = reports.slice(0, 3);
  const pendingReports = reports.filter(report => report.status === 'pending');
  const revisionReports = reports.filter(report => report.status === 'requires_revision');

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
    <div className="space-y-4">
      {/* Quick Create Button */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Service Reports
              </CardTitle>
              <CardDescription>
                Create and manage your service reports
              </CardDescription>
            </div>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-yellow-700 mb-1">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{pendingReports.length}</span>
              </div>
              <p className="text-xs text-yellow-600">Pending Review</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-orange-700 mb-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">{revisionReports.length}</span>
              </div>
              <p className="text-xs text-orange-600">Need Revision</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">{reports.filter(r => r.status === 'approved').length}</span>
              </div>
              <p className="text-xs text-green-600">Approved</p>
            </div>
          </div>

          {/* Recent Reports */}
          {recentReports.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Recent Reports</h4>
              <div className="space-y-2">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {report.clients?.first_name} {report.clients?.last_name}
                        </span>
                        <Badge className={getStatusColor(report.status)} variant="outline">
                          {getStatusIcon(report.status)}
                          {report.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.service_date), 'MMM d')}
                      </span>
                      {report.status === 'requires_revision' && (
                        <Button size="sm" variant="outline" className="h-6 px-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Items */}
          {(pendingReports.length > 0 || revisionReports.length > 0) && (
            <div>
              <h4 className="font-medium mb-3">Action Required</h4>
              <div className="space-y-2">
                {revisionReports.slice(0, 2).map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">
                        {report.clients?.first_name} {report.clients?.last_name} - Needs Revision
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.service_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reports.length === 0 && !isLoading && (
            <div className="text-center py-6">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">No service reports yet</p>
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Your First Report
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Report Dialog */}
      <CreateServiceReportDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        preSelectedClient={clientId && clientName ? { id: clientId, name: clientName } : undefined}
        preSelectedDate={serviceDate}
        bookingId={bookingId}
      />
    </div>
  );
}