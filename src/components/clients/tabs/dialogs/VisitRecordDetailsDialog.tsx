import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, Clock, User, FileText, CheckCircle, 
  AlertTriangle, MapPin, Pill, Timer, Heart, 
  Activity, Target, Smile, Droplets 
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface VisitRecord {
  id: string;
  booking_id: string;
  client_id: string;
  staff_id: string;
  branch_id: string;
  visit_start_time: string;
  visit_end_time: string;
  actual_duration_minutes?: number;
  status: string;
  visit_notes?: string;
  visit_summary?: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
  client_signature_data?: string;
  staff_signature_data?: string;
  location_data?: any;
  visit_photos?: any;
  carer_name?: string;
  booking_service?: string;
}

interface VisitRecordDetailsDialogProps {
  visit: VisitRecord | null;
  visitTasks: any[];
  visitMedications: any[];
  visitEvents: any[];
  visitVitals?: any[];
  fluidIntake?: any[];
  fluidOutput?: any[];
  urinaryOutput?: any[];
  serviceReport?: {
    client_mood?: string;
    client_engagement?: string;
    carer_observations?: string;
  } | null;
  bookingDetails?: {
    start_time?: string;
    end_time?: string;
  } | null;
  activities?: any[];
  goals?: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const calculateDuration = (startTime: string | undefined, endTime: string | undefined): string => {
  if (!startTime || !endTime) return 'N/A';
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end.getTime() - start.getTime();
  const durationMin = Math.round(durationMs / (1000 * 60));
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const VisitRecordDetailsDialog: React.FC<VisitRecordDetailsDialogProps> = ({
  visit,
  visitTasks,
  visitMedications,
  visitEvents,
  visitVitals = [],
  fluidIntake = [],
  fluidOutput = [],
  urinaryOutput = [],
  serviceReport,
  bookingDetails,
  activities = [],
  goals = [],
  open,
  onOpenChange,
}) => {
  if (!visit) return null;

  const totalIntake = fluidIntake.reduce((sum, r) => sum + (r.amount_ml || 0), 0);
  const totalFluidOutput = fluidOutput.reduce((sum, r) => sum + (r.amount_ml || 0), 0);
  const totalUrinaryOutput = urinaryOutput.reduce((sum, r) => sum + (r.amount_ml || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            Visit Record Details
          </DialogTitle>
          <DialogDescription>
            Complete information for visit on {visit.visit_start_time 
              ? format(parseISO(visit.visit_start_time), 'MMMM dd, yyyy')
              : 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div className="space-y-6 pr-4">

            {/* Visit Timing Details - Planned vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Visit Timing Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Scheduled Time Card */}
                  <div className="border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-3">Scheduled Time</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start:</span>
                        <span className="font-medium">
                          {bookingDetails?.start_time 
                            ? format(parseISO(bookingDetails.start_time), 'HH:mm')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End:</span>
                        <span className="font-medium">
                          {bookingDetails?.end_time 
                            ? format(parseISO(bookingDetails.end_time), 'HH:mm')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {calculateDuration(bookingDetails?.start_time, bookingDetails?.end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Actual Time Card */}
                  <div className="border rounded-lg p-4 bg-green-50/50 dark:bg-green-950/20">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400 mb-3">Actual Time</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start:</span>
                        <span className="font-medium">
                          {visit.visit_start_time 
                            ? format(parseISO(visit.visit_start_time), 'HH:mm')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">End:</span>
                        <span className="font-medium">
                          {visit.visit_end_time 
                            ? format(parseISO(visit.visit_end_time), 'HH:mm')
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {visit.actual_duration_minutes 
                            ? `${Math.floor(visit.actual_duration_minutes / 60)}h ${visit.actual_duration_minutes % 60}m`
                            : calculateDuration(visit.visit_start_time, visit.visit_end_time)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Visit Overview Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {visit.visit_start_time 
                      ? format(parseISO(visit.visit_start_time), 'MMMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Carer</p>
                  <p className="font-medium">{visit.carer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <Badge variant="outline">{visit.booking_service}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant="custom" className={
                    visit.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                  }>
                    {visit.status}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${visit.completion_percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{visit.completion_percentage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Mood & Engagement */}
            {(serviceReport?.client_mood || serviceReport?.client_engagement) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Client Mood & Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Mood</p>
                      <Badge variant="outline" className="text-base px-3 py-1">
                        {serviceReport?.client_mood || 'Not recorded'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Engagement</p>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {serviceReport?.client_engagement || 'Not recorded'}
                      </Badge>
                    </div>
                  </div>
                  {serviceReport?.carer_observations && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground mb-2">Observations</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{serviceReport.carer_observations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Visit Summary & Notes */}
            {(visit.visit_summary || visit.visit_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Summary & Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {visit.visit_summary && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Summary</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{visit.visit_summary}</p>
                    </div>
                  )}
                  {visit.visit_notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg">{visit.visit_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Tasks ({visitTasks.filter(t => t.is_completed).length}/{visitTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visitTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks recorded for this visit</p>
                ) : (
                  <div className="space-y-2">
                    {visitTasks.map(task => (
                      <div 
                        key={task.id} 
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {task.is_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                          <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                            {task.task_name}
                          </span>
                        </div>
                        {task.task_notes && (
                          <p className="text-xs text-muted-foreground">{task.task_notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activities Section */}
            {activities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activities ({activities.filter(a => a.status === 'completed').length}/{activities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {activities.map(activity => (
                      <div 
                        key={activity.id} 
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{activity.name}</p>
                          {activity.description && (
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                          )}
                        </div>
                        <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Goals Section */}
            {goals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals ({goals.filter(g => g.status === 'achieved').length}/{goals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {goals.map(goal => (
                      <div key={goal.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium">{goal.description}</p>
                          <Badge variant={goal.status === 'achieved' ? 'default' : 'outline'}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${goal.progress || 0}%` }} 
                            />
                          </div>
                          <span className="text-xs font-medium">{goal.progress || 0}%</span>
                        </div>
                        {goal.notes && (
                          <p className="text-xs text-muted-foreground mt-2">{goal.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Medications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Medications ({visitMedications.filter(m => m.is_administered).length}/{visitMedications.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {visitMedications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medications recorded for this visit</p>
                ) : (
                  <div className="space-y-2">
                    {visitMedications.map(med => (
                      <div 
                        key={med.id} 
                        className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {med.is_administered ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                          <div>
                            <p className="font-medium">{med.medication_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {med.dosage} - {med.administration_time 
                                ? format(parseISO(med.administration_time), 'HH:mm')
                                : 'Not administered'}
                            </p>
                          </div>
                        </div>
                        {med.notes && (
                          <p className="text-xs text-muted-foreground max-w-xs truncate">{med.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* NEWS2 & Vital Signs */}
            {visitVitals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NEWS2 & Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visitVitals.map(vital => (
                      <div key={vital.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Badge 
                            variant="custom" 
                            className={
                              vital.news2_risk_level === 'low' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : vital.news2_risk_level === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }
                          >
                            Score: {vital.news2_total_score} - {vital.news2_risk_level} Risk
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {vital.reading_time ? format(parseISO(vital.reading_time), 'HH:mm') : 'N/A'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Blood Pressure</p>
                            <p className="font-medium">{vital.systolic_bp}/{vital.diastolic_bp} mmHg</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Heart Rate</p>
                            <p className="font-medium">{vital.pulse_rate} bpm</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">SpO2</p>
                            <p className="font-medium">{vital.oxygen_saturation}%</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Temperature</p>
                            <p className="font-medium">{vital.temperature}°C</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Resp. Rate</p>
                            <p className="font-medium">{vital.respiratory_rate}/min</p>
                          </div>
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Consciousness</p>
                            <p className="font-medium">{vital.consciousness_level}</p>
                          </div>
                          {vital.supplemental_oxygen && (
                            <div className="bg-muted/50 p-2 rounded col-span-2">
                              <p className="text-xs text-muted-foreground">Supplemental O2</p>
                              <p className="font-medium">Yes</p>
                            </div>
                          )}
                        </div>
                        {vital.notes && (
                          <p className="text-xs text-muted-foreground mt-3 bg-muted/30 p-2 rounded">
                            {vital.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Events & Incidents */}
            {visitEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Events & Incidents ({visitEvents.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {visitEvents.map(event => (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{event.event_title}</p>
                          <Badge 
                            variant="custom"
                            className={
                              event.severity === 'high' 
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : event.severity === 'medium'
                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }
                          >
                            {event.severity} - {event.event_type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{event.event_description}</p>
                        {event.immediate_action_taken && (
                          <div className="mt-2 bg-muted/50 p-2 rounded">
                            <p className="text-xs text-muted-foreground">Immediate Action Taken:</p>
                            <p className="text-sm">{event.immediate_action_taken}</p>
                          </div>
                        )}
                        {event.follow_up_required && (
                          <Badge variant="secondary" className="mt-2">Follow-up Required</Badge>
                        )}
                        {event.event_time && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Occurred at: {format(parseISO(event.event_time), 'HH:mm')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fluid Balance */}
            {(fluidIntake.length > 0 || fluidOutput.length > 0 || urinaryOutput.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5" />
                    Fluid Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                        {totalIntake} ml
                      </p>
                      <p className="text-xs text-muted-foreground">Total Intake</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        {totalFluidOutput} ml
                      </p>
                      <p className="text-xs text-muted-foreground">Fluid Output</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {totalUrinaryOutput} ml
                      </p>
                      <p className="text-xs text-muted-foreground">Urinary Output</p>
                    </div>
                  </div>
                  
                  {/* Balance Summary */}
                  <div className="bg-muted/50 p-3 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Net Balance</p>
                    <p className={`text-xl font-bold ${
                      (totalIntake - totalFluidOutput - totalUrinaryOutput) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {totalIntake - totalFluidOutput - totalUrinaryOutput >= 0 ? '+' : ''}
                      {totalIntake - totalFluidOutput - totalUrinaryOutput} ml
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signatures Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Signatures
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Client Signature */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Client Signature</p>
                    {visit.client_signature_data ? (
                      <div className="border rounded-lg p-4 bg-white dark:bg-background">
                        <img 
                          src={visit.client_signature_data} 
                          alt="Client Signature" 
                          className="w-full h-32 object-contain"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Signed on {visit.visit_end_time 
                            ? format(parseISO(visit.visit_end_time), 'MMM dd, yyyy HH:mm')
                            : 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-4 bg-muted/30 flex items-center justify-center h-40">
                        <p className="text-sm text-muted-foreground">No client signature recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Staff/Carer Signature */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Carer Signature</p>
                    {visit.staff_signature_data ? (
                      <div className="border rounded-lg p-4 bg-white dark:bg-background">
                        <img 
                          src={visit.staff_signature_data} 
                          alt="Carer Signature" 
                          className="w-full h-32 object-contain"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-2">
                          Signed by {visit.carer_name} on {visit.visit_end_time 
                            ? format(parseISO(visit.visit_end_time), 'MMM dd, yyyy HH:mm')
                            : 'N/A'}
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-4 bg-muted/30 flex items-center justify-center h-40">
                        <p className="text-sm text-muted-foreground">No carer signature recorded</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location Data (if available) */}
            {visit.location_data && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(visit.location_data, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};