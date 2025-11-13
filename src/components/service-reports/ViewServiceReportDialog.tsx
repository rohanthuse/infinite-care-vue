import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitTasks } from '@/hooks/useVisitTasks';
import { useVisitMedications } from '@/hooks/useVisitMedications';
import { useVisitVitals } from '@/hooks/useVisitVitals';
import { useVisitEvents } from '@/hooks/useVisitEvents';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  User, 
  Activity,
  Pill,
  Heart,
  AlertTriangle,
  ClipboardList,
  FileText,
  CheckCircle,
  XCircle,
  Circle,
  Smile,
  Users,
  PenTool
} from 'lucide-react';
import { TasksTable } from './view-report/TasksTable';
import { MedicationsTable } from './view-report/MedicationsTable';
import { NEWS2Display } from './view-report/NEWS2Display';
import { EventsList } from './view-report/EventsList';
import { SignatureDisplay } from './view-report/SignatureDisplay';

interface ViewServiceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: any;
}

export function ViewServiceReportDialog({
  open,
  onOpenChange,
  report,
}: ViewServiceReportDialogProps) {
  // Fetch visit record data
  const { data: visitRecord } = useQuery({
    queryKey: ['visit-record', report?.visit_record_id],
    queryFn: async () => {
      if (!report?.visit_record_id) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', report.visit_record_id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!report?.visit_record_id && open,
  });

  // Fetch all related data using hooks
  const { tasks = [] } = useVisitTasks(report?.visit_record_id);
  const { medications = [] } = useVisitMedications(report?.visit_record_id);
  const { vitals = [], news2Readings = [], latestNEWS2 } = useVisitVitals(report?.visit_record_id);
  const { events = [], incidents, accidents, observations } = useVisitEvents(report?.visit_record_id);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      approved: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
      requires_revision: { variant: 'outline', icon: AlertTriangle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getMoodIcon = (mood: string) => {
    const moodIcons: Record<string, string> = {
      Happy: '😊',
      Content: '😌',
      Neutral: '😐',
      Anxious: '😰',
      Sad: '😢',
      Confused: '😕',
      Agitated: '😠',
      Calm: '😇',
    };
    return moodIcons[mood] || '😐';
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={report.clients?.avatar_url} />
                <AvatarFallback>
                  {report.clients?.first_name?.[0]}{report.clients?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl">
                  Service Report: {report.clients?.first_name} {report.clients?.last_name}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Carer: {report.staff?.first_name} {report.staff?.last_name}
                  </Badge>
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 pb-6">
          <div className="space-y-6 mt-6">
            {/* Visit Summary Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(report.service_date), 'PPP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {report.service_duration_minutes} minutes
                    </p>
                  </div>
                  {visitRecord?.visit_start_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium">
                        {format(new Date(visitRecord.visit_start_time), 'p')}
                      </p>
                    </div>
                  )}
                  {visitRecord?.visit_end_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium">
                        {format(new Date(visitRecord.visit_end_time), 'p')}
                      </p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Services Provided */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Services Provided</p>
                  <div className="flex flex-wrap gap-2">
                    {report.services_provided?.map((service: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Visit Summary Text */}
                {visitRecord?.visit_summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Visit Summary</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {visitRecord.visit_summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Details Section */}
            {tasks && tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TasksTable tasks={tasks} />
                </CardContent>
              </Card>
            )}

            {/* Medication Details Section */}
            {medications && medications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medication Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <MedicationsTable medications={medications} />
                </CardContent>
              </Card>
            )}

            {/* NEWS2 & Vital Signs Section */}
            {(news2Readings.length > 0 || vitals.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NEWS2 & Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NEWS2Display 
                    news2Readings={news2Readings} 
                    latestNEWS2={latestNEWS2}
                    otherVitals={vitals.filter(v => v.vital_type !== 'news2')}
                  />
                </CardContent>
              </Card>
            )}

            {/* Events & Incidents Section */}
            {events && events.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Events & Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EventsList 
                    incidents={incidents}
                    accidents={accidents}
                    observations={observations}
                  />
                </CardContent>
              </Card>
            )}

            {/* Client Mood & Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smile className="h-5 w-5" />
                  Client Mood & Engagement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Client Mood</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getMoodIcon(report.client_mood)}</span>
                      <Badge variant="outline">{report.client_mood}</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Engagement Level</p>
                    <Badge variant="secondary">{report.client_engagement}</Badge>
                  </div>
                </div>

                {report.activities_undertaken && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Activities Undertaken</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {report.activities_undertaken}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Visit Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Visit Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Carer Observations */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Carer Observations
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">
                    {report.carer_observations || 'No observations recorded'}
                  </p>
                </div>

                {/* Client Feedback */}
                {report.client_feedback && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Client Feedback
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {report.client_feedback}
                    </p>
                  </div>
                )}

                {/* Medication Notes */}
                {report.medication_administered && report.medication_notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Medication Notes
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {report.medication_notes}
                    </p>
                  </div>
                )}

                {/* Incident Details */}
                {report.incident_occurred && report.incident_details && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      Incident Details
                    </p>
                    <p className="text-sm bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
                      {report.incident_details}
                    </p>
                  </div>
                )}

                {/* Next Visit Preparations */}
                {report.next_visit_preparations && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Next Visit Preparations
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {report.next_visit_preparations}
                    </p>
                  </div>
                )}

                {/* Review Notes (if any) */}
                {report.review_notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Review Notes (Admin)
                    </p>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                      {report.review_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Signatures Section */}
            {(visitRecord?.staff_signature_data || visitRecord?.client_signature_data) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PenTool className="h-5 w-5" />
                    Signatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SignatureDisplay
                    carerSignature={visitRecord?.staff_signature_data}
                    carerName={`${report.staff?.first_name} ${report.staff?.last_name}`}
                    clientSignature={visitRecord?.client_signature_data}
                    clientName={`${report.clients?.first_name} ${report.clients?.last_name}`}
                  />
                </CardContent>
              </Card>
            )}

            {/* Report Metadata */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Report Created</p>
                    <p className="font-medium">
                      {format(new Date(report.created_at), 'PPp')}
                    </p>
                  </div>
                  {report.updated_at && (
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="font-medium">
                        {format(new Date(report.updated_at), 'PPp')}
                      </p>
                    </div>
                  )}
                  {report.reviewed_at && (
                    <div>
                      <p className="text-muted-foreground">Reviewed At</p>
                      <p className="font-medium">
                        {format(new Date(report.reviewed_at), 'PPp')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
