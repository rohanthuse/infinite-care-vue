
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
import { AlertTriangle, User, MapPin, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateEventLog, useEventClients } from '@/data/hooks/useEventsLogs';
import { BodyMapSelector } from './BodyMapSelector';

const eventLogSchema = z.object({
  client_id: z.string().optional(),
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
        ...data,
        client_id: data.client_id || undefined,
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

  const eventTypes = [
    { value: 'incident', label: 'Incident' },
    { value: 'accident', label: 'Accident' },
    { value: 'near_miss', label: 'Near Miss' },
    { value: 'medication_error', label: 'Medication Error' },
    { value: 'safeguarding', label: 'Safeguarding' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' },
    { value: 'other', label: 'Other' },
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

  const severityLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
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
                      <FormLabel>Client (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={clientsLoading ? "Loading clients..." : "Select client (optional)"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No client selected</SelectItem>
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

              {/* Event Classification */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="event_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {eventTypes.map((type) => (
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
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reporter and Location */}
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
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of the event..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setBodyMapPoints([]);
                  }}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  disabled={createEventLogMutation.isPending}
                >
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
