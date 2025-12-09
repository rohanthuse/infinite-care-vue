import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateServiceReport, useUpdateServiceReport } from '@/hooks/useServiceReports';
import { useClientCompletedBookings } from '@/hooks/useClientCompletedBookings';
import { useCarerContext } from '@/hooks/useCarerContext';
import { format } from 'date-fns';
import { Calendar, CalendarIcon, Clock, Plus, X, CheckCircle, FileText, ClipboardList, Pill, Activity, AlertTriangle, Target, Circle, Loader2, User, PenTool } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVisitTasks } from '@/hooks/useVisitTasks';
import { useVisitEvents } from '@/hooks/useVisitEvents';
import { useVisitVitals } from '@/hooks/useVisitVitals';
import { useCarePlanGoals } from '@/hooks/useCarePlanGoals';
import { useClientActivities } from '@/hooks/useClientActivities';
import { TasksTable } from './view-report/TasksTable';
import { MedicationsTable } from './view-report/MedicationsTable';
import { NEWS2Display } from './view-report/NEWS2Display';
import { EventsList } from './view-report/EventsList';
import { SignatureDisplay } from './view-report/SignatureDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  'Happy', 'Content', 'Neutral', 'Anxious', 'Sad', 'Confused', 'Agitated', 'Calm'
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
  const [newTask, setNewTask] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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
        .select('visit_start_time, visit_end_time, status')
        .eq('id', visitRecordId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!visitRecordId && open,
  });

  // Fetch visit tasks
  const { tasks: visitTasks = [], isLoading: isLoadingTasks } = useVisitTasks(visitRecordId);

  // Fetch visit events (incidents, accidents, observations)
  const { 
    events: visitEvents = [], 
    incidents = [], 
    accidents = [], 
    observations = [] 
  } = useVisitEvents(visitRecordId);

  // Fetch visit vitals (NEWS2 readings)
  const { 
    vitals: visitVitals = [], 
    news2Readings = [], 
    latestNEWS2,
    otherVitals = [],
    isLoading: isLoadingVitals 
  } = useVisitVitals(visitRecordId);

  // Fetch care plan ID for the client
  const { data: carePlanData } = useQuery({
    queryKey: ['client-care-plan', preSelectedBooking?.client_id],
    queryFn: async () => {
      if (!preSelectedBooking?.client_id) return null;
      
      const { data, error } = await supabase
        .from('client_care_plans')
        .select('id, auto_save_data')
        .eq('client_id', preSelectedBooking.client_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!preSelectedBooking?.client_id && open,
  });

  // Fetch care plan goals
  const { data: carePlanGoals = [] } = useCarePlanGoals(carePlanData?.id || '');

  // Fetch client activities
  const { data: clientActivities = [] } = useClientActivities(carePlanData?.id || '');

  // Fetch visit record with full details including signatures and notes
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
  
  const selectedClientId = form.watch('client_id');
  const { data: completedBookings = [] } = useClientCompletedBookings(
    preSelectedClient?.id || selectedClientId
  );

  const handleAddTask = () => {
    if (newTask.trim()) {
      const current = form.getValues('tasks_completed') || [];
      form.setValue('tasks_completed', [...current, newTask.trim()]);
      setNewTask('');
    }
  };

  const handleRemoveTask = (index: number) => {
    const current = form.getValues('tasks_completed') || [];
    form.setValue('tasks_completed', current.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (!carerContext?.staffProfile?.id || !carerContext?.staffProfile?.branch_id || !data.client_id) {
      return;
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
      // Update existing report - keep approved status
      updateServiceReport.mutate({
        id: existingReport.id,
        updates: {
          ...reportData,
          status: 'approved',
          visible_to_client: true,
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report updated successfully');
        },
      });
    } else {
      // Create new report
      createServiceReport.mutate(reportData, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      });
    }
  };

  const tasksCompleted = form.watch('tasks_completed') || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {mode === 'edit' ? (
              <>Edit Service Report{preSelectedClient ? ` for ${preSelectedClient.name}` : ''}</>
            ) : preSelectedClient ? (
              <>Create Service Report for {preSelectedClient.name}</>
            ) : (
              <>Create Service Report</>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update your service report and resubmit for admin review.'
              : 'Complete this report after providing care services to the client.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 px-6 space-y-6 pb-6">
          {/* Booking Details Summary */}
          {preSelectedBooking && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Appointment Details
              </h3>
            </div>
            
            {/* Scheduled Times Section */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
                Scheduled
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Date */}
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Date</p>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {format(new Date(preSelectedBooking.start_time), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                
                {/* Scheduled Time */}
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Time</p>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {format(new Date(preSelectedBooking.start_time), 'HH:mm')} - {format(new Date(preSelectedBooking.end_time), 'HH:mm')}
                    </p>
                  </div>
                </div>
                
                {/* Duration */}
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Duration</p>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {Math.round(
                      (new Date(preSelectedBooking.end_time).getTime() - new Date(preSelectedBooking.start_time).getTime()) / 60000
                    )} minutes
                  </p>
                </div>
                
                {/* Booked Service */}
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">Booked Service</p>
                  <Badge variant="default" className="text-xs">
                    {preSelectedBooking.service_name || 'General Service'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actual Visit Times Section */}
            {visitRecord && visitRecord.visit_start_time && visitRecord.visit_end_time && (
              <div className="pt-3 border-t border-blue-200 dark:border-blue-700 space-y-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">
                  Actual Visit Times
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Actual Start Time */}
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-1">Actual Start</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {format(new Date(visitRecord.visit_start_time), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actual End Time */}
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-1">Actual End</p>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        {format(new Date(visitRecord.visit_end_time), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                  
                  {/* Total Duration (Actual) */}
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-300 mb-1">Total Duration</p>
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {Math.round(
                        (new Date(visitRecord.visit_end_time).getTime() - 
                         new Date(visitRecord.visit_start_time).getTime()) / 60000
                      )} minutes
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Booking Notes Section */}
            {preSelectedBooking.notes && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                  Booking Notes
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                  {preSelectedBooking.notes}
                </p>
              </div>
            )}
            
            {/* Client Contact Info */}
            {preSelectedBooking.clients && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                  Client Contact
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {preSelectedBooking.clients.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-blue-600">📞</span>
                      <span className="text-blue-900 dark:text-blue-100">
                        {preSelectedBooking.clients.phone}
                      </span>
                    </div>
                  )}
                  {preSelectedBooking.clients.email && (
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-blue-600">✉️</span>
                      <span className="text-blue-900 dark:text-blue-100 truncate">
                        {preSelectedBooking.clients.email}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Visit Details Summary Section */}
        <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
              Visit Details Summary
            </h3>
            <Badge variant="outline" className="ml-auto">
              {visitRecordId ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Auto-populated from visit
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No visit record
                </>
              )}
            </Badge>
            {visitRecordId && (isLoadingTasks || isLoadingVitals) && (
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
            )}
          </div>

          {/* Loading indicator */}
          {visitRecordId && (isLoadingTasks || isLoadingVitals) && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="ml-3 text-sm text-muted-foreground">Loading visit details...</p>
            </div>
          )}

          {/* Show content if visitRecordId exists, otherwise show helpful message */}
          {!visitRecordId ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No Visit Record Found</p>
              <p className="text-sm max-w-md mx-auto">
                This appointment doesn't have an associated visit record yet. 
                Visit records are created when a carer starts and completes a visit through the mobile app.
              </p>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-700 max-w-md mx-auto">
                <p className="text-xs text-left">
                  <strong>Note:</strong> You can still create a service report manually by filling out the form below. 
                  The Visit Details Summary will be available for visits that were tracked through the system.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[350px] md:h-[400px] lg:h-[450px] w-full pr-4">
              <div className="space-y-6">
                
                {/* 1. Care Tasks & Assigned Tasks - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="h-4 w-4" />
                      Tasks Completed ({visitTasks?.filter(t => t.is_completed).length || 0}/{visitTasks?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitTasks && visitTasks.length > 0 ? (
                      <TasksTable tasks={visitTasks} />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No tasks recorded for this visit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 2. Medications - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Pill className="h-4 w-4" />
                      Medications ({visitMedications?.filter(m => m.is_administered).length || 0} administered)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitMedications && visitMedications.length > 0 ? (
                      <MedicationsTable medications={visitMedications} />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Pill className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No medications recorded for this visit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 3. NEWS2 & Vital Signs - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="h-4 w-4" />
                      Vital Signs ({news2Readings?.length || 0} NEWS2 readings, {otherVitals?.length || 0} other vitals)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(news2Readings && news2Readings.length > 0) || (otherVitals && otherVitals.length > 0) ? (
                      <NEWS2Display 
                        news2Readings={news2Readings} 
                        latestNEWS2={latestNEWS2}
                        otherVitals={otherVitals}
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No vital signs recorded for this visit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 4. Events & Incidents - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="h-4 w-4" />
                      Events & Incidents ({visitEvents?.length || 0} recorded)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {visitEvents && visitEvents.length > 0 ? (
                      <EventsList 
                        incidents={incidents}
                        accidents={accidents}
                        observations={observations}
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No events or incidents recorded for this visit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 5. Care Plan Goals - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-4 w-4" />
                      Care Plan Goals ({carePlanGoals?.filter(g => g.status === 'completed' || g.status === 'achieved').length || 0} completed)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carePlanGoals && carePlanGoals.length > 0 ? (
                      <div className="space-y-3">
                        {carePlanGoals.map((goal) => (
                          <div key={goal.id} className="flex items-start gap-3 p-3 border rounded-lg">
                            <div className="flex-shrink-0 mt-1">
                              {goal.status === 'completed' || goal.status === 'achieved' ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : goal.status === 'in-progress' || goal.status === 'in_progress' ? (
                                <Circle className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Circle className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{goal.description}</p>
                              {goal.measurable_outcome && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Target: {goal.measurable_outcome}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {goal.status}
                                </Badge>
                                {goal.progress !== undefined && goal.progress !== null && (
                                  <span className="text-xs text-muted-foreground">
                                    {goal.progress}% complete
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No care plan goals for this client</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 6. Client Activities - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4" />
                      Client Activities ({clientActivities?.filter(a => a.status === 'completed').length || 0} completed)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientActivities && clientActivities.length > 0 ? (
                      <div className="space-y-2">
                        {clientActivities.map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <p className="font-medium text-sm">{activity.name}</p>
                              {activity.description && (
                                <p className="text-xs text-muted-foreground">{activity.description}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {activity.frequency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No activities recorded for this client</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 7. Visit Notes / Carer Notes - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4" />
                      Visit Notes / Carer Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fullVisitRecord?.visit_notes ? (
                      <div className="p-3 bg-muted rounded border">
                        <p className="text-sm whitespace-pre-wrap">{fullVisitRecord.visit_notes}</p>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No notes recorded during this visit</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 8. Care Plan Information - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="h-4 w-4" />
                      Care Plan Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carePlanData?.auto_save_data && typeof carePlanData.auto_save_data === 'object' && 'personalInfo' in carePlanData.auto_save_data ? (
                      <div className="space-y-2 text-sm">
                        {(carePlanData.auto_save_data as any).personalInfo?.preferred_name && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Preferred Name:</span>
                            <span className="font-medium">{(carePlanData.auto_save_data as any).personalInfo.preferred_name}</span>
                          </div>
                        )}
                        {(carePlanData.auto_save_data as any).personalInfo?.communication_preferences && (
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Communication:</span>
                            <span className="font-medium">{(carePlanData.auto_save_data as any).personalInfo.communication_preferences}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <User className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No care plan information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 9. Sign-Off Details - ALWAYS SHOW */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <PenTool className="h-4 w-4" />
                      Sign-Off Details (Signatures)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(fullVisitRecord?.staff_signature_data || fullVisitRecord?.client_signature_data) ? (
                      <SignatureDisplay
                        carerSignature={fullVisitRecord.staff_signature_data}
                        carerName={preSelectedBooking?.staff_name || 'Carer'}
                        clientSignature={fullVisitRecord.client_signature_data}
                        clientName={preSelectedBooking?.client_name || 'Client'}
                      />
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <PenTool className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Visit not signed off yet</p>
                        <p className="text-xs mt-1">Signatures will appear after visit completion and sign-off</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            </ScrollArea>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Information */}
            {preSelectedClient && !preSelectedBooking && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Client: {preSelectedClient.name}</p>
              </div>
            )}

            {/* Booking Selection */}
            {preSelectedClient && completedBookings.length > 0 && !preSelectedBooking && (
              <FormField
                control={form.control}
                name="booking_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link to Completed Booking (Optional)</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        const booking = completedBookings.find(b => b.id === value);
                        if (booking) {
                          setSelectedBooking(booking);
                        }
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a completed booking (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {completedBookings.map((booking: any) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {format(new Date(booking.start_time), 'MMM dd, yyyy HH:mm')} - 
                            {booking.services?.title || 'Service'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Link this report to a specific completed booking. This will auto-fill date and duration.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedBooking && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-100">Booking Linked</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Service details have been auto-filled from the selected booking.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Completed */}
            <div className="space-y-4">
              <FormLabel>Specific Tasks Completed (Optional)</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add task completed..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                />
                <Button type="button" onClick={handleAddTask} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {tasksCompleted.map((task, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {task}
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Client Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Mood</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mood" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {moodOptions.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
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
                    <FormLabel>Client Engagement</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Activities */}
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
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Additional Sections */}
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
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="carer_observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carer Observations *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Your professional observations about the client's condition, progress, concerns..."
                      {...field}
                      rows={4}
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
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createServiceReport.isPending || updateServiceReport.isPending}>
                {mode === 'edit' 
                  ? (updateServiceReport.isPending ? 'Resubmitting...' : 'Update & Resubmit')
                  : (createServiceReport.isPending ? 'Submitting...' : 'Submit Report')
                }
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}