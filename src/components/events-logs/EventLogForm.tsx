import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateEventLog, useEventClients } from '@/data/hooks/useEventsLogs';
import { useReportTypeOptions } from '@/hooks/useParameterOptions';
import { BodyMapSelector } from './BodyMapSelector';

const eventLogSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  title: z.string().min(1, 'Title is required'),
  event_type: z.string().min(1, 'Event type is required'),
  category: z.string().min(1, 'Category is required'),
  severity: z.string().min(1, 'Severity is required'),
  status: z.string().min(1, 'Status is required'),
  reporter: z.string().min(1, 'Reporter name is required'),
  location: z.string().optional(),
  description: z.string().optional(),
});

type EventLogFormData = z.infer<typeof eventLogSchema>;

interface EventLogFormProps {
  branchId: string;
}

export function EventLogForm({ branchId }: EventLogFormProps) {
  const [bodyMapPoints, setBodyMapPoints] = useState<any[]>([]);
  const createEventLogMutation = useCreateEventLog();
  const { data: clients = [], isLoading: clientsLoading } = useEventClients(branchId);
  const { data: reportTypeOptions = [], isLoading: reportTypesLoading } = useReportTypeOptions();

  const form = useForm<EventLogFormData>({
    resolver: zodResolver(eventLogSchema),
    defaultValues: {
      client_id: '',
      title: '',
      event_type: '',
      category: 'other',
      severity: 'low',
      status: 'open',
      reporter: '',
      location: '',
      description: '',
    },
  });

  const onSubmit = async (data: EventLogFormData) => {
    try {
      const eventData = {
        client_id: data.client_id,
        title: data.title,
        event_type: data.event_type,
        category: data.category,
        severity: data.severity,
        status: data.status,
        reporter: data.reporter,
        location: data.location || undefined,
        description: data.description || undefined,
        body_map_points: bodyMapPoints.length > 0 ? bodyMapPoints : undefined,
        branch_id: branchId !== 'global' ? branchId : undefined,
      };

      await createEventLogMutation.mutateAsync(eventData);
      
      // Reset form and body map
      form.reset();
      setBodyMapPoints([]);
      toast.success('Event log created successfully');
    } catch (error) {
      console.error('Error creating event log:', error);
      toast.error('Failed to create event log');
    }
  };

  const handleReset = () => {
    form.reset();
    setBodyMapPoints([]);
    toast.info('Form reset');
  };

  const severityLevels = [
    { value: 'low', label: 'Low', description: 'Minor issue with minimal impact' },
    { value: 'medium', label: 'Medium', description: 'Moderate issue requiring attention' },
    { value: 'high', label: 'High', description: 'Serious issue requiring urgent action' },
    { value: 'critical', label: 'Critical', description: 'Critical issue requiring immediate action' },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open', description: 'Newly reported event' },
    { value: 'in-progress', label: 'In Progress', description: 'Event being investigated' },
    { value: 'resolved', label: 'Resolved', description: 'Event resolved' },
    { value: 'closed', label: 'Closed', description: 'Event closed' },
  ];

  const categories = [
    { value: 'accident', label: 'Accident' },
    { value: 'incident', label: 'Incident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'medication_error', label: 'Medication Error' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            New Event/Log Entry
          </CardTitle>
          <CardDescription>
            Record a new event, incident, or log entry with optional body map for injuries
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the event" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select client"} />
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
                </div>
              </div>

              {/* Event Classification */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Event Classification</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="event_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={reportTypesLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={reportTypesLoading ? "Loading..." : "Select event type"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {reportTypeOptions.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
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
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {severityLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                <div>
                                  <div className="font-medium">{level.label}</div>
                                  <div className="text-xs text-gray-500">{level.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Reporter and Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Event Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="reporter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reporter *</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person reporting" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Where did this occur?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <div>
                                  <div className="font-medium">{status.label}</div>
                                  <div className="text-xs text-gray-500">{status.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Description</h3>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide a detailed description of what happened, including any relevant context, circumstances, and outcomes..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Body Map Section */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Body Map (Optional)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Click on the body diagram to mark areas of injury or concern. This is particularly useful for accident and incident reports.
                  </p>
                </div>
                
                <BodyMapSelector
                  selectedPoints={bodyMapPoints}
                  onPointsChange={setBodyMapPoints}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={createEventLogMutation.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={createEventLogMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {createEventLogMutation.isPending ? 'Creating...' : 'Create Event Log'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
