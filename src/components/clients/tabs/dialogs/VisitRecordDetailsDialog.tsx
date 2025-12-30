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
  AlertTriangle, MapPin, Pill 
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VisitRecordDetailsDialog: React.FC<VisitRecordDetailsDialogProps> = ({
  visit,
  visitTasks,
  visitMedications,
  visitEvents,
  open,
  onOpenChange,
}) => {
  if (!visit) return null;

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
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">
                    {visit.visit_start_time && visit.visit_end_time
                      ? `${format(parseISO(visit.visit_start_time), 'HH:mm')} - ${format(parseISO(visit.visit_end_time), 'HH:mm')}`
                      : 'In Progress'}
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
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {visit.actual_duration_minutes 
                      ? `${visit.actual_duration_minutes} minutes` 
                      : 'Ongoing'}
                  </p>
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
                      <div className="border rounded-lg p-4 bg-white">
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
                      <div className="border border-dashed rounded-lg p-4 bg-gray-50 flex items-center justify-center h-40">
                        <p className="text-sm text-muted-foreground">No client signature recorded</p>
                      </div>
                    )}
                  </div>

                  {/* Staff/Carer Signature */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Carer Signature</p>
                    {visit.staff_signature_data ? (
                      <div className="border rounded-lg p-4 bg-white">
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
                      <div className="border border-dashed rounded-lg p-4 bg-gray-50 flex items-center justify-center h-40">
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
