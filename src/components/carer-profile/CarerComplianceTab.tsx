import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useStaffCompliance } from '@/hooks/useStaffCompliance';
import { format } from 'date-fns';

interface CarerComplianceTabProps {
  carerId: string;
}

export const CarerComplianceTab: React.FC<CarerComplianceTabProps> = ({ carerId }) => {
  const { data: complianceData, isLoading, error } = useStaffCompliance(carerId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !complianceData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load compliance data</p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
      case 'expiring-soon':
        return <Badge className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'not-started':
        return <Badge className="bg-gray-100 text-gray-800">Not Started</Badge>;
      case 'missing':
        return <Badge className="bg-red-100 text-red-800">Missing</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className={`border-2 ${getScoreBgColor(complianceData.overallScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Overall Compliance Score
            </CardTitle>
            <div className={`text-4xl font-bold ${getScoreColor(complianceData.overallScore)}`}>
              {complianceData.overallScore}%
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={complianceData.overallScore} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {complianceData.overallScore >= 90 && 'Excellent compliance record'}
            {complianceData.overallScore >= 70 && complianceData.overallScore < 90 && 'Good compliance with some areas for improvement'}
            {complianceData.overallScore < 70 && 'Requires attention - multiple compliance issues'}
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Training Compliance */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold text-blue-600">
                {complianceData.trainingCompliance.percentage}%
              </span>
            </div>
            <h4 className="font-semibold text-sm">Training Compliance</h4>
            <p className="text-xs text-muted-foreground">
              {complianceData.trainingCompliance.compliantCount}/{complianceData.trainingCompliance.totalRequired} compliant
            </p>
          </CardContent>
        </Card>

        {/* Missed Calls */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-2xl font-bold text-red-600">
                {complianceData.missedCalls.count}
              </span>
            </div>
            <h4 className="font-semibold text-sm">Missed Calls</h4>
            <p className="text-xs text-muted-foreground">Last 100 bookings</p>
          </CardContent>
        </Card>

        {/* Late Arrivals */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-600">
                {complianceData.lateArrivals.count}
              </span>
            </div>
            <h4 className="font-semibold text-sm">Late Arrivals</h4>
            <p className="text-xs text-muted-foreground">
              Avg: {complianceData.lateArrivals.averageMinutesLate} mins late
            </p>
          </CardContent>
        </Card>

        {/* Incidents */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-600">
                {complianceData.incidents.count}
              </span>
            </div>
            <h4 className="font-semibold text-sm">Visit Incidents</h4>
            <p className="text-xs text-muted-foreground">Recorded incidents</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Compliance Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Training Compliance Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceData.trainingCompliance.items.length > 0 ? (
            <div className="space-y-3">
              {complianceData.trainingCompliance.items.map((training, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{training.courseTitle}</h4>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      {training.completionDate && (
                        <span>Completed: {format(new Date(training.completionDate), 'PP')}</span>
                      )}
                      {training.expiryDate && (
                        <span>
                          Expires: {format(new Date(training.expiryDate), 'PP')}
                          {training.daysUntilExpiry !== null && training.daysUntilExpiry > 0 && (
                            <span className="ml-1">({training.daysUntilExpiry} days)</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(training.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No training records found</p>
          )}
        </CardContent>
      </Card>

      {/* Document Expiry Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Expiry Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="text-green-600 font-semibold">{complianceData.documents.validCount} Valid</span>
            <span className="text-yellow-600 font-semibold">{complianceData.documents.expiringCount} Expiring Soon</span>
            <span className="text-red-600 font-semibold">{complianceData.documents.expiredCount} Expired</span>
          </div>
          {complianceData.documents.items.length > 0 ? (
            <div className="space-y-3">
              {complianceData.documents.items.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{doc.documentType}</h4>
                    {doc.expiryDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Expires: {format(new Date(doc.expiryDate), 'PP')}
                        {doc.daysUntilExpiry !== null && doc.daysUntilExpiry > 0 && (
                          <span className="ml-1">({doc.daysUntilExpiry} days)</span>
                        )}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(doc.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No documents found</p>
          )}
        </CardContent>
      </Card>

      {/* Missed Calls & Late Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missed Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Missed Calls ({complianceData.missedCalls.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceData.missedCalls.items.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {complianceData.missedCalls.items.map((call, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{call.clientName}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700">Missed</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {format(new Date(call.scheduledDate), 'PPp')}
                    </p>
                    {call.reason && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Reason: {call.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No missed calls</p>
            )}
          </CardContent>
        </Card>

        {/* Late Arrivals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Late Arrivals ({complianceData.lateArrivals.count})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {complianceData.lateArrivals.items.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {complianceData.lateArrivals.items.map((arrival, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{arrival.clientName}</span>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                        {arrival.minutesLate} mins late
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scheduled: {format(new Date(arrival.scheduledTime), 'PPp')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Arrived: {format(new Date(arrival.actualArrivalTime), 'PPp')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No late arrivals</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Incident Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Visit Incident Logs ({complianceData.incidents.count})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {complianceData.incidents.items.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {complianceData.incidents.items.map((incident) => (
                <div key={incident.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{incident.incidentType}</h4>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Incident
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Date: {format(new Date(incident.reportedDate), 'PP')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No incidents recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
