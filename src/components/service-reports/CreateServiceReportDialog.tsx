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
import { Calendar, CalendarIcon, Clock, Plus, X, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  booking_id: z.string().optional(),
  service_date: z.string().min(1, 'Service date is required'),
  service_duration_minutes: z.number().min(1, 'Duration is required'),
  tasks_completed: z.array(z.string()).optional(),
  client_mood: z.string().min(1, 'Client mood is required'),
  client_engagement: z.string().min(1, 'Client engagement is required'),
  activities_undertaken: z.string().optional(),
  medication_administered: z.boolean().default(false),
  medication_notes: z.string().optional(),
  incident_occurred: z.boolean().default(false),
  incident_details: z.string().optional(),
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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: preSelectedClient?.id || '',
      service_date: preSelectedDate || format(new Date(), 'yyyy-MM-dd'),
      service_duration_minutes: 60,
      tasks_completed: [],
      client_mood: '',
      client_engagement: '',
      activities_undertaken: '',
      medication_administered: false,
      medication_notes: '',
      incident_occurred: false,
      incident_details: '',
      next_visit_preparations: '',
      carer_observations: '',
      client_feedback: '',
    },
  });

  // Auto-fill form fields when preSelectedBooking is provided
  React.useEffect(() => {
    if (preSelectedBooking) {
      const duration = Math.round(
        (new Date(preSelectedBooking.end_time).getTime() - 
         new Date(preSelectedBooking.start_time).getTime()) / 60000
      );
      form.setValue('service_duration_minutes', duration);
      form.setValue('service_date', format(new Date(preSelectedBooking.start_time), 'yyyy-MM-dd'));
    }
  }, [preSelectedBooking, form]);

  // Auto-populate medication summary from visit medications
  React.useEffect(() => {
    if (visitRecordId && visitMedications && visitMedications.length > 0 && open) {
      const administeredMeds = visitMedications.filter(m => m.is_administered);
      const missedMeds = visitMedications.filter(m => !m.is_administered);
      
      let summary = '';
      if (administeredMeds.length > 0) {
        summary += `Administered:\n${administeredMeds.map(m => `• ${m.medication_name} (${m.dosage})`).join('\n')}\n\n`;
        
        // Add notes if any
        const medsWithNotes = administeredMeds.filter(m => m.administration_notes);
        if (medsWithNotes.length > 0) {
          summary += `Notes:\n`;
          medsWithNotes.forEach(med => {
            summary += `• ${med.medication_name}: ${med.administration_notes}\n`;
          });
        }
      }
      
      if (missedMeds.length > 0) {
        if (summary) summary += '\n';
        summary += `Not administered:\n${missedMeds.map(m => `• ${m.medication_name}${m.missed_reason ? ` - ${m.missed_reason}` : ''}`).join('\n')}`;
      }
      
      if (summary) {
        form.setValue('medication_notes', summary.trim());
        form.setValue('medication_administered', administeredMeds.length > 0);
      }
    }
  }, [visitRecordId, visitMedications, open, form]);

  // Populate form with existing report data when editing
  React.useEffect(() => {
    if (mode === 'edit' && existingReport && open) {
      form.reset({
        client_id: existingReport.client_id,
        booking_id: existingReport.booking_id || '',
        service_date: existingReport.service_date,
        service_duration_minutes: existingReport.service_duration_minutes,
        tasks_completed: existingReport.tasks_completed || [],
        client_mood: existingReport.client_mood || '',
        client_engagement: existingReport.client_engagement || '',
        activities_undertaken: existingReport.activities_undertaken || '',
        medication_administered: existingReport.medication_administered || false,
        medication_notes: existingReport.medication_notes || '',
        incident_occurred: existingReport.incident_occurred || false,
        incident_details: existingReport.incident_details || '',
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
      service_date: data.service_date,
      service_duration_minutes: data.service_duration_minutes,
      tasks_completed: data.tasks_completed,
      client_mood: data.client_mood,
      client_engagement: data.client_engagement,
      activities_undertaken: data.activities_undertaken,
      medication_administered: data.medication_administered,
      medication_notes: data.medication_notes,
      incident_occurred: data.incident_occurred,
      incident_details: data.incident_details,
      next_visit_preparations: data.next_visit_preparations,
      carer_observations: data.carer_observations,
      client_feedback: data.client_feedback,
      staff_id: carerContext.staffProfile.id,
      branch_id: carerContext.staffProfile.branch_id,
      visit_record_id: visitRecordId,
      created_by: carerContext.staffProfile.id,
    };

    if (mode === 'edit' && existingReport) {
      // Update existing report and reset status to pending for re-review
      updateServiceReport.mutate({
        id: existingReport.id,
        updates: {
          ...reportData,
          status: 'pending',
          reviewed_at: null,
          reviewed_by: null,
          review_notes: null,
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
          toast.success('Service report resubmitted for review');
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
  const medicationAdministered = form.watch('medication_administered');
  const incidentOccurred = form.watch('incident_occurred');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                          form.setValue('service_date', format(new Date(booking.start_time), 'yyyy-MM-dd'));
                          const duration = Math.round(
                            (new Date(booking.end_time).getTime() - new Date(booking.start_time).getTime()) / 60000
                          );
                          form.setValue('service_duration_minutes', duration);
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

            {/* Medication Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="medication_administered"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Medication administered</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {medicationAdministered && (
                <FormField
                  control={form.control}
                  name="medication_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detail which medications were given, times, and any observations..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Incident Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="incident_occurred"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Incident occurred during visit</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {incidentOccurred && (
                <FormField
                  control={form.control}
                  name="incident_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Details</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide detailed description of the incident, actions taken, and any follow-up required..."
                          {...field}
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
      </DialogContent>
    </Dialog>
  );
}