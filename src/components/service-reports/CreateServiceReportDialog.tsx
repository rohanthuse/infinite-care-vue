import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateServiceReport, useUpdateServiceReport } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
import { format, differenceInMinutes } from 'date-fns';
import { Calendar, Clock, CheckCircle, FileText, ClipboardList, Pill, Activity, AlertTriangle, Loader2, User, PenTool, Smile, Heart, Timer, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitTasks } from '@/hooks/useVisitTasks';
import { useVisitEvents } from '@/hooks/useVisitEvents';
import { useVisitVitals } from '@/hooks/useVisitVitals';
import { SignatureDisplay } from './view-report/SignatureDisplay';
import { EditableTasksTable } from './edit-report/EditableTasksTable';
import { EditableMedicationsTable } from './edit-report/EditableMedicationsTable';
import { EditableNEWS2Form } from './edit-report/EditableNEWS2Form';
import { EditableEventsList } from './edit-report/EditableEventsList';
import { EditableVisitSummary } from './edit-report/EditableVisitSummary';
import { EditableGoalsSection } from './edit-report/EditableGoalsSection';
import { EditableActivitiesSection } from './edit-report/EditableActivitiesSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { formatSafeDate } from '@/lib/dateUtils';
import { formatDurationHoursMinutes } from '@/lib/utils';
const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  booking_id: z.string().optional(),
  tasks_completed: z.array(z.string()).optional(),
  client_mood: z.string().min(1, 'Client mood is required'),
  client_engagement: z.string().min(1, 'Client engagement is required'),
  activities_undertaken: z.string().optional(),
  next_visit_preparations: z.string().optional(),
  carer_observations: z.string().min(1, 'Carer observations are required'),
  client_feedback: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateServiceReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedClient?: {
    id: string;
    name: string;
  };
  preSelectedDate?: string;
  visitRecordId?: string;
  bookingId?: string;
  preSelectedBooking?: any;
  existingReport?: any;
  mode?: 'create' | 'edit';
}

const moodOptions = [
  { value: 'Happy', emoji: '😊' },
  { value: 'Content', emoji: '😌' },
  { value: 'Neutral', emoji: '😐' },
  { value: 'Anxious', emoji: '😰' },
  { value: 'Sad', emoji: '😢' },
  { value: 'Confused', emoji: '😕' },
  { value: 'Agitated', emoji: '😠' },
  { value: 'Calm', emoji: '😇' },
];

const engagementOptions = [
  'Very Engaged', 'Engaged', 'Somewhat Engaged', 'Limited Engagement', 'Not Engaged'
];

export function CreateServiceReportDialog({
  open,
  onOpenChange,
  preSelectedClient,
  preSelectedDate,
  visitRecordId,
  bookingId,
  preSelectedBooking,
  existingReport,
  mode = 'create',
}: CreateServiceReportDialogProps) {
  const { data: carerContext } = useCarerContext();
  const createServiceReport = useCreateServiceReport();
  const updateServiceReport = useUpdateServiceReport();
  const queryClient = useQueryClient();

  // State for pending changes in edit mode
  const [pendingTaskChanges, setPendingTaskChanges] = useState<Map<string, { is_completed: boolean; completion_notes: string }>>(new Map());
  const [pendingMedicationChanges, setPendingMedicationChanges] = useState<Map<string, { is_administered: boolean; administration_time: string; administration_notes: string; not_administered_reason: string }>>(new Map());
  const [pendingVitalChanges, setPendingVitalChanges] = useState<{
    respiratory_rate: number;
    oxygen_saturation: number;
    supplemental_oxygen: boolean;
    systolic_bp: number;
    diastolic_bp: number;
    pulse_rate: number;
    consciousness_level: 'A' | 'V' | 'P' | 'U';
    temperature: number;
  } | null>(null);
  const [pendingEventChanges, setPendingEventChanges] = useState<Map<string, { event_title: string; event_description: string; severity: string; follow_up_required: boolean; follow_up_notes: string }>>(new Map());
  const [pendingVisitSummary, setPendingVisitSummary] = useState<string | null>(null);
  const [pendingGoalChanges, setPendingGoalChanges] = useState<Map<string, { status: string; progress: number; notes: string }>>(new Map());
  const [pendingActivityChanges, setPendingActivityChanges] = useState<Map<string, { performed: boolean; duration_minutes: number; notes: string }>>(new Map());

  // Fetch client's care plan ID
  const { data: clientCarePlan } = useQuery({
    queryKey: ['client-care-plan', preSelectedClient?.id],
    queryFn: async () => {
      if (!preSelectedClient?.id) return null;
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id')
        .eq('client_id', preSelectedClient.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!preSelectedClient?.id && open,
  });

  // Fetch visit medications when visitRecordId is provided
  const { data: visitMedications = [] } = useQuery({
    queryKey: ['visit-medications', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return [];
      
      const { data, error } = await supabase
        .from('visit_medications')
        .select('*')
        .eq('visit_record_id', visitRecordId)
        .order('prescribed_time', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!visitRecordId && open,
  });

  // Fetch visit record details when visitRecordId is provided
  const { data: visitRecord } = useQuery({
    queryKey: ['visit-record-details', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', visitRecordId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!visitRecordId && open,
  });

  // Fetch visit tasks
  const { tasks: visitTasks = [], isLoading: isLoadingTasks, updateTask } = useVisitTasks(visitRecordId);

  // Fetch visit events (incidents, accidents, observations)
  const { 
    events: visitEvents = [], 
    incidents = [], 
    accidents = [], 
    observations = [],
    updateEvent
  } = useVisitEvents(visitRecordId);

  // Fetch visit vitals (NEWS2 readings)
  const { 
    news2Readings = [], 
    latestNEWS2,
    otherVitals = [],
    isLoading: isLoadingVitals,
    updateVital
  } = useVisitVitals(visitRecordId);

  // Fetch full visit record with signatures
  const { data: fullVisitRecord } = useQuery({
    queryKey: ['full-visit-record', visitRecordId],
    queryFn: async () => {
      if (!visitRecordId) return null;
      
      const { data, error } = await supabase
        .from('visit_records')
        .select('*')
        .eq('id', visitRecordId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!visitRecordId && open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: preSelectedClient?.id || '',
      tasks_completed: [],
      client_mood: '',
      client_engagement: '',
      activities_undertaken: '',
      next_visit_preparations: '',
      carer_observations: '',
      client_feedback: '',
    },
  });

  // Populate form with existing report data when editing
  React.useEffect(() => {
    if (mode === 'edit' && existingReport && open) {
      form.reset({
        client_id: existingReport.client_id,
        booking_id: existingReport.booking_id || '',
        tasks_completed: existingReport.tasks_completed || [],
        client_mood: existingReport.client_mood || '',
        client_engagement: existingReport.client_engagement || '',
        activities_undertaken: existingReport.activities_undertaken || '',
        next_visit_preparations: existingReport.next_visit_preparations || '',
        carer_observations: existingReport.carer_observations || '',
        client_feedback: existingReport.client_feedback || '',
      });
    }
  }, [mode, existingReport, open, form]);

  const onSubmit = async (data: FormData) => {
    if (!carerContext?.staffProfile?.id || !carerContext?.staffProfile?.branch_id || !data.client_id) {
      return;
    }

    // In edit mode, save all pending changes first
    if (mode === 'edit') {
      try {
        // Save task changes
        for (const [taskId, changes] of pendingTaskChanges) {
          await updateTask.mutateAsync({
            taskId,
            isCompleted: changes.is_completed,
            notes: changes.completion_notes,
          });
        }

        // Save medication changes
        for (const [medId, changes] of pendingMedicationChanges) {
          await supabase
            .from('visit_medications')
            .update({
              is_administered: changes.is_administered,
              administration_time: changes.administration_time ? new Date(`1970-01-01T${changes.administration_time}`).toISOString() : null,
              administration_notes: changes.administration_notes || null,
              not_administered_reason: changes.not_administered_reason || null,
            })
            .eq('id', medId);
        }

        // Save vital changes
        if (pendingVitalChanges && latestNEWS2) {
          await updateVital.mutateAsync({
            vitalId: latestNEWS2.id,
            updates: pendingVitalChanges,
          });
        }

        // Save event changes
        for (const [eventId, changes] of pendingEventChanges) {
          await updateEvent.mutateAsync({
            eventId,
            updates: {
              event_title: changes.event_title,
              event_description: changes.event_description,
              severity: changes.severity as 'low' | 'medium' | 'high' | 'critical',
              follow_up_required: changes.follow_up_required,
              follow_up_notes: changes.follow_up_notes,
            },
          });
        }

        // Save visit summary
        if (pendingVisitSummary !== null && visitRecordId) {
          await supabase
            .from('visit_records')
            .update({ visit_summary: pendingVisitSummary })
            .eq('id', visitRecordId);
        }

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['visit-tasks'] });
        queryClient.invalidateQueries({ queryKey: ['visit-medications'] });
        queryClient.invalidateQueries({ queryKey: ['visit-vitals'] });
        queryClient.invalidateQueries({ queryKey: ['visit-events'] });
        queryClient.invalidateQueries({ queryKey: ['visit-record-details'] });
      } catch (error) {
        console.error('Error saving changes:', error);
        toast.error('Failed to save some changes');
      }
    }

    const reportData = {
      client_id: data.client_id,
      booking_id: bookingId || data.booking_id || null,
      service_date: preSelectedBooking 
        ? format(new Date(preSelectedBooking.start_time), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      service_duration_minutes: preSelectedBooking 
        ? Math.round((new Date(preSelectedBooking.end_time).getTime() - new Date(preSelectedBooking.start_time).getTime()) / 60000)
        : 60,
      tasks_completed: data.tasks_completed,
      client_mood: data.client_mood,
      client_engagement: data.client_engagement,
      activities_undertaken: data.activities_undertaken,
      medication_administered: false,
      medication_notes: null,
      incident_occurred: false,
      incident_details: null,
      next_visit_preparations: data.next_visit_preparations,
      carer_observations: data.carer_observations,
      client_feedback: data.client_feedback,
      staff_id: carerContext.staffProfile.id,
      branch_id: carerContext.staffProfile.branch_id,
      visit_record_id: visitRecordId,
      created_by: carerContext.staffProfile.id,
    };

    if (mode === 'edit' && existingReport) {
      updateServiceReport.mutate({
        id: existingReport.id,
        updates: {
          ...reportData,
          status: 'pending',
          visible_to_client: false,
          submitted_at: new Date().toISOString(),
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report updated and submitted for review');
        },
      });
    } else {
      createServiceReport.mutate({
        ...reportData,
        status: 'pending',
        visible_to_client: false,
        submitted_at: new Date().toISOString(),
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report submitted for admin review');
        },
      });
    }
  };

  // Get client and carer names
  const clientName = existingReport?.clients 
    ? `${existingReport.clients.first_name} ${existingReport.clients.last_name}`
    : preSelectedClient?.name || 'Client';
  
  const carerName = existingReport?.staff 
    ? `${existingReport.staff.first_name} ${existingReport.staff.last_name}`
    : carerContext?.staffProfile 
      ? `${carerContext.staffProfile.first_name} ${carerContext.staffProfile.last_name}`
      : 'Carer';

  const clientInitials = clientName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Get service date and duration
  const serviceDate = existingReport?.service_date || (preSelectedBooking ? format(new Date(preSelectedBooking.start_time), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const serviceDuration = existingReport?.service_duration_minutes || (preSelectedBooking 
    ? Math.round((new Date(preSelectedBooking.end_time).getTime() - new Date(preSelectedBooking.start_time).getTime()) / 60000)
    : 60);

  const isDataLoading = isLoadingTasks || isLoadingVitals;

  // Calculate scheduled times from preSelectedBooking
  const scheduledStartTime = preSelectedBooking?.start_time ? new Date(preSelectedBooking.start_time) : null;
  const scheduledEndTime = preSelectedBooking?.end_time ? new Date(preSelectedBooking.end_time) : null;
  const scheduledDurationMins = scheduledStartTime && scheduledEndTime 
    ? differenceInMinutes(scheduledEndTime, scheduledStartTime)
    : null;

  // Calculate actual times from visitRecord
  const actualStartTime = visitRecord?.visit_start_time ? new Date(visitRecord.visit_start_time) : null;
  const actualEndTime = visitRecord?.visit_end_time ? new Date(visitRecord.visit_end_time) : null;
  const actualDurationMins = actualStartTime && actualEndTime 
    ? differenceInMinutes(actualEndTime, actualStartTime)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={existingReport?.clients?.avatar_url} />
              <AvatarFallback>{clientInitials}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">
                {mode === 'edit' ? 'Edit Service Report' : 'Create Service Report'}: {clientName}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Carer: {carerName}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  PENDING REVIEW
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Form Body */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-200px)] overflow-y-auto px-6">
          <Form {...form}>
            <form id="service-report-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              
              {/* Loading State */}
              {isDataLoading && visitRecordId && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading visit details...</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Visit Timing Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="h-5 w-5" />
                    Visit Timing Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scheduled Time Column */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Scheduled Time
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Start</p>
                          <p className="font-medium">
                            {scheduledStartTime ? format(scheduledStartTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End</p>
                          <p className="font-medium">
                            {scheduledEndTime ? format(scheduledEndTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium text-primary">
                            {scheduledDurationMins !== null ? formatDurationHoursMinutes(scheduledDurationMins) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actual Time Column */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Actual Time
                      </h4>
                      <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Start</p>
                          <p className="font-medium">
                            {actualStartTime ? format(actualStartTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">End</p>
                          <p className="font-medium">
                            {actualEndTime ? format(actualEndTime, 'h:mm a') : 'N/A'}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium text-primary">
                            {actualDurationMins !== null ? formatDurationHoursMinutes(actualDurationMins) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Service Date */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Service Date</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatSafeDate(serviceDate, 'PPP')}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Visit Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mode === 'edit' ? (
                    <EditableVisitSummary
                      visitSummary={visitRecord?.visit_summary}
                      servicesProvided={existingReport?.services_provided}
                      serviceName={preSelectedBooking?.service_name}
                      onSummaryChange={setPendingVisitSummary}
                    />
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Services Provided</p>
                        <div className="flex flex-wrap gap-2">
                          {existingReport?.services_provided?.length > 0 ? (
                            existingReport.services_provided.map((service: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {service}
                              </Badge>
                            ))
                          ) : preSelectedBooking?.service_name ? (
                            <Badge variant="secondary">{preSelectedBooking.service_name}</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">No services recorded</span>
                          )}
                        </div>
                      </div>
                      {visitRecord?.visit_summary && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Visit Notes</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">
                              {visitRecord.visit_summary}
                            </p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Task Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Task Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableTasksTable 
                    tasks={visitTasks || []} 
                    onTasksChange={setPendingTaskChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Medication Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Medication Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableMedicationsTable 
                    medications={visitMedications || []} 
                    onMedicationsChange={setPendingMedicationChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* NEWS2 & Vital Signs Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    NEWS2 & Vital Signs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableNEWS2Form 
                    latestNEWS2={latestNEWS2} 
                    onVitalChange={setPendingVitalChanges}
                    allowCreate={true}
                  />
                </CardContent>
              </Card>

              {/* Events & Incidents Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Events & Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableEventsList 
                    incidents={incidents || []}
                    accidents={accidents || []}
                    observations={observations || []}
                    onEventsChange={setPendingEventChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Goals Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Care Plan Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableGoalsSection 
                    carePlanId={clientCarePlan?.id}
                    onGoalsChange={setPendingGoalChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Activities Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Activities Performed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EditableActivitiesSection 
                    carePlanId={clientCarePlan?.id}
                    onActivitiesChange={setPendingActivityChanges}
                    allowManualAdd={true}
                  />
                </CardContent>
              </Card>

              {/* Client Mood & Engagement Card - Editable */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smile className="h-5 w-5" />
                    Client Mood & Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_mood"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Mood <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select mood" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {moodOptions.map((mood) => (
                                <SelectItem key={mood.value} value={mood.value}>
                                  {mood.emoji} {mood.value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="client_engagement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Engagement <span className="text-destructive">*</span></FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select engagement level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {engagementOptions.map((engagement) => (
                                <SelectItem key={engagement} value={engagement}>
                                  {engagement}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="activities_undertaken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activities Undertaken</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe any activities, exercises, or social interactions..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Visit Notes Card - Editable */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Visit Notes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="carer_observations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carer Observations <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your professional observations about the client's condition, progress, concerns..."
                            {...field}
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_feedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Feedback</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any feedback or comments from the client..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="next_visit_preparations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Visit Preparations</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any special preparations, supplies needed, or items to follow up on..."
                            {...field}
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Signatures Card - Read Only */}
              {(fullVisitRecord?.staff_signature_data || fullVisitRecord?.client_signature_data) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PenTool className="h-5 w-5" />
                      Signatures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SignatureDisplay
                      carerSignature={fullVisitRecord?.staff_signature_data}
                      carerName={carerName}
                      clientSignature={fullVisitRecord?.client_signature_data}
                      clientName={clientName}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Report Metadata Card */}
              {mode === 'edit' && existingReport && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Report Created</p>
                        <p className="font-medium">
                          {formatSafeDate(existingReport.created_at, 'PPp')}
                        </p>
                      </div>
                      {existingReport.updated_at && formatSafeDate(existingReport.updated_at, 'PPp') !== 'N/A' && (
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-medium">
                            {formatSafeDate(existingReport.updated_at, 'PPp')}
                          </p>
                        </div>
                      )}
                      {existingReport.reviewed_at && formatSafeDate(existingReport.reviewed_at, 'PPp') !== 'N/A' && (
                        <div>
                          <p className="text-muted-foreground">Reviewed At</p>
                          <p className="font-medium">
                            {formatSafeDate(existingReport.reviewed_at, 'PPp')}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            </form>
          </Form>
        </ScrollArea>

        {/* Fixed Footer with Action Buttons */}
        <div className="px-6 py-4 border-t flex justify-end gap-3 bg-background">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            form="service-report-form"
            disabled={createServiceReport.isPending || updateServiceReport.isPending}
          >
            {mode === 'edit' 
              ? (updateServiceReport.isPending ? 'Updating...' : 'Update Report')
              : (createServiceReport.isPending ? 'Saving...' : 'Save Report')
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
