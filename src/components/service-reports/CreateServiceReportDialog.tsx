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
import { useCreateServiceReport } from '@/hooks/useServiceReports';
import { useCarerContext } from '@/hooks/useCarerContext';
import { format } from 'date-fns';
import { Calendar, CalendarIcon, Clock, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  service_date: z.string().min(1, 'Service date is required'),
  service_duration_minutes: z.number().min(1, 'Duration is required'),
  services_provided: z.array(z.string()).min(1, 'At least one service must be provided'),
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
}

const moodOptions = [
  'Happy', 'Content', 'Neutral', 'Anxious', 'Sad', 'Confused', 'Agitated', 'Calm'
];

const engagementOptions = [
  'Very Engaged', 'Engaged', 'Somewhat Engaged', 'Limited Engagement', 'Not Engaged'
];

const commonServices = [
  'Personal Care', 'Medication Support', 'Meal Preparation', 'Companionship',
  'Mobility Support', 'Household Tasks', 'Transport', 'Shopping', 'Health Monitoring'
];

export function CreateServiceReportDialog({
  open,
  onOpenChange,
  preSelectedClient,
  preSelectedDate,
  visitRecordId,
  bookingId,
}: CreateServiceReportDialogProps) {
  const { data: carerContext } = useCarerContext();
  const createServiceReport = useCreateServiceReport();
  const [newService, setNewService] = useState('');
  const [newTask, setNewTask] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: preSelectedClient?.id || '',
      service_date: preSelectedDate || format(new Date(), 'yyyy-MM-dd'),
      service_duration_minutes: 60,
      services_provided: [],
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

  const handleAddService = () => {
    if (newService.trim()) {
      const current = form.getValues('services_provided') || [];
      form.setValue('services_provided', [...current, newService.trim()]);
      setNewService('');
    }
  };

  const handleRemoveService = (index: number) => {
    const current = form.getValues('services_provided') || [];
    form.setValue('services_provided', current.filter((_, i) => i !== index));
  };

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
      service_date: data.service_date,
      service_duration_minutes: data.service_duration_minutes,
      services_provided: data.services_provided,
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
      booking_id: bookingId,
      created_by: carerContext.staffProfile.id,
    };

    createServiceReport.mutate(reportData, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  const servicesProvided = form.watch('services_provided') || [];
  const tasksCompleted = form.watch('tasks_completed') || [];
  const medicationAdministered = form.watch('medication_administered');
  const incidentOccurred = form.watch('incident_occurred');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Create Service Report
          </DialogTitle>
          <DialogDescription>
            Complete this report after providing care services to the client.
          </DialogDescription>
        </DialogHeader>

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
            {preSelectedClient && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Client: {preSelectedClient.name}</p>
              </div>
            )}

            {/* Services Provided */}
            <div className="space-y-4">
              <FormLabel>Services Provided</FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {commonServices.map((service) => (
                  <Badge
                    key={service}
                    variant={servicesProvided.includes(service) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const current = form.getValues('services_provided') || [];
                      if (current.includes(service)) {
                        form.setValue('services_provided', current.filter(s => s !== service));
                      } else {
                        form.setValue('services_provided', [...current, service]);
                      }
                    }}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom service..."
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddService())}
                />
                <Button type="button" onClick={handleAddService} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {servicesProvided.map((service, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

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
              <Button type="submit" disabled={createServiceReport.isPending}>
                {createServiceReport.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}