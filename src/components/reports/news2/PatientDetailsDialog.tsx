
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  Clock,
  Download,
  Thermometer,
  Heart,
  Gauge,
  Zap,
  Brain,
  Stethoscope
} from "lucide-react";
import { format } from "date-fns";
import { usePatientObservations } from "@/hooks/useNews2Data";
import { Skeleton } from "@/components/ui/skeleton";
import { ObservationChart } from "./ObservationChart";

interface PatientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: any;
}

export function PatientDetailsDialog({ open, onOpenChange, patient }: PatientDetailsDialogProps) {
  const { data: observations, isLoading } = usePatientObservations(patient?._raw?.id);

  if (!patient) return null;

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-red-600 bg-red-50";
    if (score >= 5) return "text-orange-600 bg-orange-50";
    if (score >= 3) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getVitalIcon = (vital: string) => {
    switch (vital) {
      case 'respiratory_rate': return <Stethoscope className="h-4 w-4" />;
      case 'oxygen_saturation': return <Zap className="h-4 w-4" />;
      case 'systolic_bp': return <Gauge className="h-4 w-4" />;
      case 'pulse_rate': return <Heart className="h-4 w-4" />;
      case 'temperature': return <Thermometer className="h-4 w-4" />;
      case 'consciousness_level': return <Brain className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const latestObservation = observations?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {patient.name} - NEWS2 Monitoring
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{patient.age}</div>
                <div className="text-sm text-gray-500">Years Old</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-1 ${getScoreColor(patient.latestScore)}`}>
                  {patient.latestScore}
                </div>
                <div className="text-sm text-gray-500">Latest Score</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Badge variant={getRiskBadgeVariant(patient.riskLevel)} className="mb-2">
                  {patient.riskLevel?.toUpperCase()} RISK
                </Badge>
                <div className="text-sm text-gray-500">Risk Level</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{patient.observations}</div>
                <div className="text-sm text-gray-500">Total Observations</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="observations" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="observations">Recent Observations</TabsTrigger>
              <TabsTrigger value="trends">Trends & Charts</TabsTrigger>
              <TabsTrigger value="alerts">Alerts & Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="observations" className="space-y-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : observations && observations.length > 0 ? (
                <div className="space-y-4">
                  {observations.slice(0, 10).map((obs) => (
                    <Card key={obs.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {format(new Date(obs.recorded_at), "PPP 'at' p")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(obs.total_score)}`}>
                              Score: {obs.total_score}
                            </div>
                            <Badge variant={getRiskBadgeVariant(obs.risk_level)}>
                              {obs.risk_level.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            {getVitalIcon('respiratory_rate')}
                            <div>
                              <div className="text-sm font-medium">Resp. Rate</div>
                              <div className="text-sm text-gray-600">
                                {obs.respiratory_rate || 'N/A'} 
                                {obs.respiratory_rate && <span className="ml-1 text-xs">({obs.respiratory_rate_score})</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getVitalIcon('oxygen_saturation')}
                            <div>
                              <div className="text-sm font-medium">O₂ Sat</div>
                              <div className="text-sm text-gray-600">
                                {obs.oxygen_saturation || 'N/A'}
                                {obs.oxygen_saturation && <span className="ml-1 text-xs">({obs.oxygen_saturation_score})</span>}
                                {obs.supplemental_oxygen && <span className="ml-1 text-red-600 text-xs">(+O₂)</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getVitalIcon('systolic_bp')}
                            <div>
                              <div className="text-sm font-medium">Sys BP</div>
                              <div className="text-sm text-gray-600">
                                {obs.systolic_bp || 'N/A'}
                                {obs.systolic_bp && <span className="ml-1 text-xs">({obs.systolic_bp_score})</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getVitalIcon('pulse_rate')}
                            <div>
                              <div className="text-sm font-medium">Pulse</div>
                              <div className="text-sm text-gray-600">
                                {obs.pulse_rate || 'N/A'}
                                {obs.pulse_rate && <span className="ml-1 text-xs">({obs.pulse_rate_score})</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            {getVitalIcon('temperature')}
                            <div>
                              <div className="text-sm font-medium">Temperature</div>
                              <div className="text-sm text-gray-600">
                                {obs.temperature || 'N/A'}°C
                                {obs.temperature && <span className="ml-1 text-xs">({obs.temperature_score})</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {getVitalIcon('consciousness_level')}
                            <div>
                              <div className="text-sm font-medium">Consciousness</div>
                              <div className="text-sm text-gray-600">
                                {obs.consciousness_level} - {
                                  obs.consciousness_level === 'A' ? 'Alert' :
                                  obs.consciousness_level === 'V' ? 'Voice' :
                                  obs.consciousness_level === 'P' ? 'Pain' : 'Unresponsive'
                                }
                                <span className="ml-1 text-xs">({obs.consciousness_level_score})</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {obs.clinical_notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium mb-1">Clinical Notes</div>
                            <div className="text-sm text-gray-600">{obs.clinical_notes}</div>
                          </div>
                        )}

                        {obs.action_taken && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <div className="text-sm font-medium mb-1">Actions Taken</div>
                            <div className="text-sm text-gray-600">{obs.action_taken}</div>
                          </div>
                        )}

                        <div className="mt-3 text-xs text-gray-500">
                          Recorded by: {obs.recorded_by ? `${obs.recorded_by.first_name} ${obs.recorded_by.last_name}` : 'Unknown'}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No observations recorded</h3>
                  <p className="text-gray-500">Start monitoring by recording the first observation</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              {observations && observations.length > 0 ? (
                <ObservationChart observations={observations} />
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No trend data available</h3>
                  <p className="text-gray-500">Charts will appear once more observations are recorded</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">Alert system coming soon</h3>
                <p className="text-gray-500">Automated alerts and escalation protocols will be available here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
