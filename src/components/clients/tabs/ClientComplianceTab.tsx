import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Calendar, 
  Pill, 
  Heart, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";
import { useClientCompliance } from "@/hooks/useClientCompliance";
import { format } from "date-fns";

interface ClientComplianceTabProps {
  clientId: string;
}

export const ClientComplianceTab: React.FC<ClientComplianceTabProps> = ({ clientId }) => {
  const { data: compliance, isLoading } = useClientCompliance(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!compliance) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No compliance data available
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 70) return <Badge className="bg-yellow-600">Good</Badge>;
    return <Badge variant="destructive">Needs Attention</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Overall Compliance Score */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Compliance Score</CardTitle>
              <CardDescription>Client's overall adherence to care plan</CardDescription>
            </div>
            {getScoreBadge(compliance.overallScore)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-6xl font-bold ${getScoreColor(compliance.overallScore)}`}>
              {compliance.overallScore}%
            </div>
            <div className="flex-1">
              <Progress value={compliance.overallScore} className="h-4" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Medication Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Medication Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{compliance.medicationCompliance.complianceRate}%</span>
              <Progress value={compliance.medicationCompliance.complianceRate} className="w-32 h-2" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Administered On Time
                </span>
                <span className="font-semibold">{compliance.medicationCompliance.administeredOnTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  Late Administration
                </span>
                <span className="font-semibold">{compliance.medicationCompliance.late}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missed
                </span>
                <span className="font-semibold">{compliance.medicationCompliance.missed}</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between font-medium">
                <span>Total Medications</span>
                <span>{compliance.medicationCompliance.totalMedications}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Visit Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{compliance.visitCompliance.complianceRate}%</span>
              <Progress value={compliance.visitCompliance.complianceRate} className="w-32 h-2" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completed Visits
                </span>
                <span className="font-semibold">{compliance.visitCompliance.completedVisits}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missed Visits
                </span>
                <span className="font-semibold">{compliance.visitCompliance.missedVisits}</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between font-medium">
                <span>Total Visits</span>
                <span>{compliance.visitCompliance.totalVisits}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appointment Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Appointment Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{compliance.appointmentCompliance.complianceRate}%</span>
              <Progress value={compliance.appointmentCompliance.complianceRate} className="w-32 h-2" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Attended
                </span>
                <span className="font-semibold">{compliance.appointmentCompliance.attended}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missed
                </span>
                <span className="font-semibold">{compliance.appointmentCompliance.missed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  Cancelled
                </span>
                <span className="font-semibold">{compliance.appointmentCompliance.cancelled}</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between font-medium">
                <span>Total Appointments</span>
                <span>{compliance.appointmentCompliance.totalAppointments}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Monitoring Compliance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Health Monitoring
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{compliance.healthMonitoring.complianceRate}%</span>
              <Progress value={compliance.healthMonitoring.complianceRate} className="w-32 h-2" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Completed Readings
                </span>
                <span className="font-semibold">{compliance.healthMonitoring.completedReadings}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Missed Readings
                </span>
                <span className="font-semibold">{compliance.healthMonitoring.missedReadings}</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between font-medium">
                <span>Total Readings</span>
                <span>{compliance.healthMonitoring.totalReadings}</span>
              </div>
              {compliance.healthMonitoring.lastReadingDate && (
                <div className="pt-2 border-t text-muted-foreground">
                  <span>Last Reading: </span>
                  <span className="font-medium">
                    {format(new Date(compliance.healthMonitoring.lastReadingDate), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
