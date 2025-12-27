import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, User, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { VisitRecordDetailsDialog } from "./dialogs/VisitRecordDetailsDialog";

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
  // Signature fields
  client_signature_data?: string;
  staff_signature_data?: string;
  // Location and photos
  location_data?: any;
  visit_photos?: any;
  // Related data
  carer_name?: string;
  booking_service?: string;
  tasks_completed?: number;
  total_tasks?: number;
}

export const VisitRecordsTab: React.FC<VisitRecordsTabProps> = ({ clientId }) => {
  const [selectedVisit, setSelectedVisit] = useState<VisitRecord | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch visit records for the client
  const { data: visitRecords = [], isLoading } = useQuery({
    queryKey: ['client-visit-records', clientId],
    queryFn: async () => {
      console.log('[VisitRecordsTab] Fetching visit records for client:', clientId);
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('client_id', clientId)
        .order('visit_start_time', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit records:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch staff names
      const staffIds = [...new Set(data.map(v => v.staff_id).filter(Boolean))];
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, first_name, last_name')
        .in('id', staffIds);

      // Fetch booking and service info
      const bookingIds = [...new Set(data.map(v => v.booking_id).filter(Boolean))];
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('id, service_id, services:service_id(id, title)')
        .in('id', bookingIds);

      // Create lookup maps
      const staffMap = new Map(staffData?.map(s => [s.id, `${s.first_name} ${s.last_name}`.trim()]) || []);
      const bookingMap = new Map(bookingsData?.map(b => [b.id, b.services?.title || 'Unknown Service']) || []);

      // Transform with REAL data
      const transformedData = data.map(visit => ({
        ...visit,
        carer_name: staffMap.get(visit.staff_id) || 'Unknown Carer',
        booking_service: bookingMap.get(visit.booking_id) || 'Unknown Service',
      }));

      console.log('[VisitRecordsTab] Transformed visit records:', transformedData);
      return transformedData as VisitRecord[];
    },
    enabled: !!clientId,
  });

  // Fetch tasks for selected visit
  const { data: visitTasks = [] } = useQuery({
    queryKey: ['visit-tasks', selectedVisit?.id],
    queryFn: async () => {
      if (!selectedVisit) return [];
      
      const { data, error } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_record_id', selectedVisit.id)
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
    queryKey: ['visit-medications', selectedVisit?.id],
    queryFn: async () => {
      if (!selectedVisit) return [];
      
      const { data, error } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', selectedVisit.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit medications:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedVisit,
  });

  // Fetch events for selected visit
  const { data: visitEvents = [] } = useQuery({
    queryKey: ['visit-events', selectedVisit?.id],
    queryFn: async () => {
      if (!selectedVisit) return [];
      
      const { data, error } = await supabase
        .from('visit_events')
        .select('*')
        .eq('visit_record_id', selectedVisit.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[VisitRecordsTab] Error fetching visit events:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedVisit,
  });

  const getCompletionBadge = (percentage: number) => {
    if (percentage >= 100) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Complete</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Nearly Complete</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">In Progress</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Incomplete</Badge>;
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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Visits</p>
                <p className="text-2xl font-bold text-primary">{visitRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedVisits}</p>
                <p className="text-xs text-muted-foreground">visits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-600">{Math.floor(avgDurationMin / 60)}h {avgDurationMin % 60}m</p>
                <p className="text-xs text-muted-foreground">per visit</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">This Month</p>
                <p className="text-2xl font-bold text-orange-600">
                  {visitRecords.filter(v => {
                    if (!v.visit_start_time) return false;
                    const visitDate = new Date(v.visit_start_time);
                    const now = new Date();
                    return visitDate.getMonth() === now.getMonth() && visitDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
                <p className="text-xs text-muted-foreground">visits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Visits */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Visit Records</CardTitle>
          </div>
          <CardDescription>Detailed records of all care visits</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {visitRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm">No visit records available</p>
              <p className="text-xs text-muted-foreground mt-1">
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
                        onClick={() => {
                          setSelectedVisit(visit);
                          setIsDialogOpen(true);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Visit Record Details Dialog */}
      <VisitRecordDetailsDialog
        visit={selectedVisit}
        visitTasks={visitTasks}
        visitMedications={visitMedications}
        visitEvents={visitEvents}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
};