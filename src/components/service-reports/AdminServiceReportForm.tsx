import React, { useState, useEffect } from 'react';
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
import { format } from 'date-fns';
import { Plus, X, Save, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const formSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  staff_id: z.string().min(1, 'Staff member is required'),
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
  visible_to_client: z.boolean().default(true),
  status: z.enum(['pending', 'approved', 'rejected', 'requires_revision']).default('approved'),
});

type FormData = z.infer<typeof formSchema>;

interface AdminServiceReportFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  clients: Array<{ id: string; first_name: string; last_name: string; }>;
  staff: Array<{ id: string; first_name: string; last_name: string; }>;
  existingReport?: any; // For editing existing reports
  mode: 'create' | 'edit';
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

export function AdminServiceReportForm({
  open,
  onOpenChange,
  branchId,
  clients,
  staff,
  existingReport,
  mode
}: AdminServiceReportFormProps) {
  const createServiceReport = useCreateServiceReport();
  const updateServiceReport = useUpdateServiceReport();
  const [newService, setNewService] = useState('');
  const [newTask, setNewTask] = useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: '',
      staff_id: '',
      service_date: format(new Date(), 'yyyy-MM-dd'),
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
      visible_to_client: true,
      status: 'approved',
    },
  });

  // Populate form with existing report data when editing
  useEffect(() => {
    if (mode === 'edit' && existingReport && open) {
      form.reset({
        client_id: existingReport.client_id,
        staff_id: existingReport.staff_id,
        service_date: existingReport.service_date,
        service_duration_minutes: existingReport.service_duration_minutes,
        services_provided: existingReport.services_provided || [],
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
        visible_to_client: existingReport.visible_to_client ?? true,
        status: existingReport.status || 'approved',
      });
    } else if (mode === 'create' && open) {
      form.reset({
        client_id: '',
        staff_id: '',
        service_date: format(new Date(), 'yyyy-MM-dd'),
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
        visible_to_client: true,
        status: 'approved',
      });
    }
  }, [mode, existingReport, open, form]);

  const onSubmit = (data: FormData) => {
    if (mode === 'create') {
      const reportData = {
        client_id: data.client_id,
        staff_id: data.staff_id,
        service_date: data.service_date,
        service_duration_minutes: data.service_duration_minutes,
        services_provided: data.services_provided,
        tasks_completed: data.tasks_completed || [],
        client_mood: data.client_mood,
        client_engagement: data.client_engagement,
        activities_undertaken: data.activities_undertaken || '',
        medication_administered: data.medication_administered,
        medication_notes: data.medication_notes || '',
        incident_occurred: data.incident_occurred,
        incident_details: data.incident_details || '',
        next_visit_preparations: data.next_visit_preparations || '',
        carer_observations: data.carer_observations,
        client_feedback: data.client_feedback || '',
        visible_to_client: data.visible_to_client,
        status: data.status,
        branch_id: branchId,
        created_by: data.staff_id,
        submitted_at: new Date().toISOString(),
        reviewed_at: data.status === 'approved' ? new Date().toISOString() : undefined,
      };

      createServiceReport.mutate(reportData, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    } else {
      updateServiceReport.mutate({
        id: existingReport.id,
        updates: {
          client_id: data.client_id,
          staff_id: data.staff_id,
          service_date: data.service_date,
          service_duration_minutes: data.service_duration_minutes,
          services_provided: data.services_provided,
          tasks_completed: data.tasks_completed || [],
          client_mood: data.client_mood,
          client_engagement: data.client_engagement,
          activities_undertaken: data.activities_undertaken || '',
          medication_administered: data.medication_administered,
          medication_notes: data.medication_notes || '',
          incident_occurred: data.incident_occurred,
          incident_details: data.incident_details || '',
          next_visit_preparations: data.next_visit_preparations || '',
          carer_observations: data.carer_observations,
          client_feedback: data.client_feedback || '',
          visible_to_client: data.visible_to_client,
          status: data.status,
          last_modified_by: data.staff_id,
          reviewed_at: data.status === 'approved' ? new Date().toISOString() : undefined,
        }
      }, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const servicesProvided = form.watch('services_provided') || [];
  const tasksCompleted = form.watch('tasks_completed') || [];

  const addService = (service: string) => {
    if (service && !servicesProvided.includes(service)) {
      form.setValue('services_provided', [...servicesProvided, service]);
    }
  };

  const removeService = (service: string) => {
    form.setValue('services_provided', servicesProvided.filter(s => s !== service));
  };

  const addTask = (task: string) => {
    if (task && !tasksCompleted.includes(task)) {
      form.setValue('tasks_completed', [...tasksCompleted, task]);
    }
  };

  const removeTask = (task: string) => {
    form.setValue('tasks_completed', tasksCompleted.filter(t => t !== task));
  };

  const isPending = createServiceReport.isPending || updateServiceReport.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {mode === 'create' ? 'Create Service Report' : 'Edit Service Report'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new service report as an administrator.'
              : 'Edit the existing service report and update its status.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name}
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
                name="staff_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staff.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.first_name} {member.last_name}
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
                name="service_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Date *</FormLabel>
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
                    <FormLabel>Duration (minutes) *</FormLabel>
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

            {/* Services Provided */}
            <div className="space-y-3">
              <FormLabel>Services Provided *</FormLabel>
              <div className="flex flex-wrap gap-2 mb-3">
                {commonServices.map((service) => (
                  <Button
                    key={service}
                    type="button"
                    variant={servicesProvided.includes(service) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (servicesProvided.includes(service)) {
                        removeService(service);
                      } else {
                        addService(service);
                      }
                    }}
                  >
                    {service}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom service..."
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addService(newService);
                      setNewService('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addService(newService);
                    setNewService('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {servicesProvided.map((service) => (
                  <Badge key={service} variant="secondary" className="flex items-center gap-1">
                    {service}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeService(service)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tasks Completed */}
            <div className="space-y-3">
              <FormLabel>Tasks Completed</FormLabel>
              <div className="flex gap-2">
                <Input
                  placeholder="Add task completed..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTask(newTask);
                      setNewTask('');
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    addTask(newTask);
                    setNewTask('');
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1">
                {tasksCompleted.map((task) => (
                  <Badge key={task} variant="outline" className="flex items-center gap-1">
                    {task}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTask(task)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
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
                    <FormLabel>Client Mood *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel>Client Engagement *</FormLabel>
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

            {/* Activities and Observations */}
            <FormField
              control={form.control}
              name="activities_undertaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activities Undertaken</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe activities completed during the visit..."
                      {...field}
                      rows={3}
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
                      placeholder="Detailed observations about the client's condition, behavior, needs..."
                      {...field}
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Medication and Incidents */}
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
                      <FormLabel>Medication Administered</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('medication_administered') && (
                <FormField
                  control={form.control}
                  name="medication_notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Details about medication administered..."
                          {...field}
                          rows={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                      <FormLabel>Incident Occurred</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('incident_occurred') && (
                <FormField
                  control={form.control}
                  name="incident_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the incident in detail..."
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

            {/* Additional Fields */}
            <FormField
              control={form.control}
              name="next_visit_preparations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Visit Preparations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any preparations needed for the next visit..."
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
              name="client_feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any feedback from the client..."
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Admin Controls */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Admin Controls</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending Review</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="requires_revision">Requires Revision</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visible_to_client"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visible to Client</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this report visible to the client
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isPending 
                  ? (mode === 'create' ? 'Creating...' : 'Updating...')
                  : (mode === 'create' ? 'Create Report' : 'Update Report')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}