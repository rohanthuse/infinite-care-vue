import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, User, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

interface VisitRecordsTabProps {
  clientId: string;
}

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
  // Related data
  carer_name?: string;
  booking_service?: string;
  tasks_completed?: number;
  total_tasks?: number;
}

export const VisitRecordsTab: React.FC<VisitRecordsTabProps> = ({ clientId }) => {
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);

  // Fetch visit records for the client
  const { data: visitRecords = [], isLoading } = useQuery({
    queryKey: ['client-visit-records', clientId],
    queryFn: async () => {
      console.log('[VisitRecordsTab] Fetching visit records for client:', clientId);
      
      // Get visit records directly by client_id
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('client_id', clientId)
        .order('visit_start_time', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit records:', error);
        throw error;
      }

      // Transform the data - use correct field names
      const transformedData = data?.map(visit => ({
        ...visit,
        carer_name: 'Care Team',
        booking_service: 'Care Service',
      })) || [];

      console.log('[VisitRecordsTab] Transformed visit records:', transformedData);
      return transformedData as VisitRecord[];
    },
    enabled: !!clientId,
  });

  // Fetch tasks for selected visit
  const { data: visitTasks = [] } = useQuery({
    queryKey: ['visit-tasks', selectedVisit],
    queryFn: async () => {
      if (!selectedVisit) return [];
      
      const { data, error } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_record_id', selectedVisit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit tasks:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedVisit,
  });

  // Fetch medications for selected visit
  const { data: visitMedications = [] } = useQuery({
    queryKey: ['visit-medications', selectedVisit],
    queryFn: async () => {
      if (!selectedVisit) return [];
      
      const { data, error } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', selectedVisit)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit medications:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedVisit,
  });

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-blue-100 text-blue-800">Nearly Complete</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Incomplete</Badge>;
    }
  };

  const getDuration = (startTime: string, endTime: string) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading visit records...</span>
      </div>
    );
  }

  const completedVisits = visitRecords.filter(v => v.completion_percentage >= 100).length;
  const totalDuration = visitRecords.reduce((total, visit) => {
    if (!visit.visit_start_time || !visit.visit_end_time) return total;
    const start = new Date(visit.visit_start_time);
    const end = new Date(visit.visit_end_time);
    return total + (end.getTime() - start.getTime());
  }, 0);
  const avgDurationMin = visitRecords.length > 0 ? Math.round(totalDuration / (visitRecords.length * 1000 * 60)) : 0;

  return (
    <div className="space-y-6">
      {/* Visit Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Total Visits</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{visitRecords.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{completedVisits}</div>
            <p className="text-xs text-muted-foreground">100% completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Avg Duration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{Math.floor(avgDurationMin / 60)}h</div>
            <p className="text-xs text-muted-foreground">{avgDurationMin % 60} minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">This Month</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="text-3xl font-bold text-primary">
            {visitRecords.filter(v => {
              if (!v.visit_start_time) return false;
              const visitDate = new Date(v.visit_start_time);
              const now = new Date();
              return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
            }).length}
          </div>
            <p className="text-xs text-muted-foreground">visits this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Visit Records</span>
          </CardTitle>
          <CardDescription>
            Detailed records of all care visits
          </CardDescription>
        </CardHeader>
        <CardContent>
          {visitRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No visit records available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Visit records will appear after care visits are completed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Carer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitRecords.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {visit.visit_start_time ? format(parseISO(visit.visit_start_time), 'MMM dd, yyyy') : 'N/A'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {visit.visit_start_time && visit.visit_end_time ? 
                            `${format(parseISO(visit.visit_start_time), 'HH:mm')} - ${format(parseISO(visit.visit_end_time), 'HH:mm')}` :
                            'Time not recorded'
                          }
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{visit.carer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{visit.booking_service}</Badge>
                    </TableCell>
                    <TableCell>{visit.actual_duration_minutes ? `${visit.actual_duration_minutes}m` : 
                      getDuration(visit.visit_start_time || '', visit.visit_end_time || '')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCompletionBadge(visit.completion_percentage)}
                        <span className="text-sm text-muted-foreground">
                          {visit.completion_percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVisit(
                          selectedVisit === visit.id ? null : visit.id
                        )}
                      >
                        {selectedVisit === visit.id ? 'Hide' : 'View'} Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Visit Details */}
      {selectedVisit && (() => {
        const visit = visitRecords.find(v => v.id === selectedVisit);
        if (!visit) return null;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visit Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Visit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="font-medium mb-2">Visit Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span>{visit.visit_start_time ? format(parseISO(visit.visit_start_time), 'MMM dd, yyyy') : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span>
                          {visit.visit_start_time && visit.visit_end_time ? 
                            `${format(parseISO(visit.visit_start_time), 'HH:mm')} - ${format(parseISO(visit.visit_end_time), 'HH:mm')}` :
                            'Not recorded'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{visit.actual_duration_minutes ? `${visit.actual_duration_minutes}m` : 
                          getDuration(visit.visit_start_time || '', visit.visit_end_time || '')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Carer:</span>
                        <span>{visit.carer_name}</span>
                      </div>
                    </div>
                </div>

                {visit.visit_summary && (
                  <div>
                    <h4 className="font-medium mb-2">Visit Summary</h4>
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm">{visit.visit_summary}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks & Medications */}
            <Card>
              <CardHeader>
                <CardTitle>Tasks & Medications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Tasks ({visitTasks.filter(t => t.is_completed).length}/{visitTasks.length})</span>
                  </h4>
                  {visitTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tasks recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {visitTasks.slice(0, 5).map(task => (
                        <div key={task.id} className="flex items-center space-x-2 text-sm">
                          {task.is_completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                          <span className={task.is_completed ? 'line-through text-muted-foreground' : ''}>
                            {task.task_name}
                          </span>
                        </div>
                      ))}
                      {visitTasks.length > 5 && (
                        <p className="text-sm text-muted-foreground">+{visitTasks.length - 5} more tasks</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Medications ({visitMedications.filter(m => m.is_administered).length}/{visitMedications.length})</span>
                  </h4>
                  {visitMedications.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No medications recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {visitMedications.slice(0, 5).map(med => (
                        <div key={med.id} className="flex items-center space-x-2 text-sm">
                          {med.is_administered ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                          )}
                          <span>
                            {med.medication_name} ({med.dosage})
                          </span>
                        </div>
                      ))}
                      {visitMedications.length > 5 && (
                        <p className="text-sm text-muted-foreground">+{visitMedications.length - 5} more medications</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};