
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, MapPin, Upload, User, Users, X, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { BodyMapSelector } from "./BodyMapSelector";
import { ActionsList } from "./ActionsList";
import { AttachmentsList } from "./AttachmentsList";
import { ReferralQuestions } from "./ReferralQuestions";
import { StaffDetailsSection } from "./StaffDetailsSection";
import { toast } from "sonner";

// Mock data
const mockClients = [
  { id: "CL001", name: "Aderinsola Thomas" },
  { id: "CL002", name: "James Wilson" },
  { id: "CL003", name: "Sophia Martinez" },
  { id: "CL004", name: "Michael Johnson" },
  { id: "CL005", name: "Emma Williams" },
  { id: "CL006", name: "Daniel Smith" }
];

// Mock staff
const mockStaff = [
  { id: "ST001", name: "Alex Chen" },
  { id: "ST002", name: "Maria Rodriguez" },
  { id: "ST003", name: "John Williams" },
  { id: "ST004", name: "Sarah Johnson" },
  { id: "ST005", name: "David Brown" }
];

// Form schema
const eventLogFormSchema = z.object({
  eventType: z.enum(["client", "staff"], {
    required_error: "Please select if this is for a client or staff",
  }),
  clientId: z.string().optional().or(z.literal("")),
  staffId: z.string().optional().or(z.literal("")),
  location: z.string().min(1, "Location is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  time: z.string().min(1, "Time is required"),
  eventCategory: z.string().min(1, "Event type is required"),
  details: z.string().min(1, "Details are required"),
  caseOutcome: z.string().optional(),
  injuryOccurred: z.enum(["yes", "no"], {
    required_error: "Please select if an injury occurred",
  }),
  staffPresent: z.array(z.string()).optional(),
  staffAware: z.array(z.string()).optional(),
  peoplePresent: z.array(z.string()).optional(),
  referredToSafeguarding: z.enum(["yes", "no"]).optional(),
  reportedToPolice: z.enum(["yes", "no"]).optional(),
  reportedToRegulator: z.enum(["yes", "no"]).optional(),
  followUpRequired: z.enum(["yes", "no"]).optional(),
  status: z.string().min(1, "Status is required"),
  visibleToClient: z.boolean().default(false),
});

type EventLogFormValues = z.infer<typeof eventLogFormSchema>;

interface EventLogFormProps {
  branchId: string;
}

export function EventLogForm({ branchId }: EventLogFormProps) {
  const [actions, setActions] = useState<Array<{ id: string; text: string; date: Date }>>([]);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; type: string; size: number }>>([]);
  const [bodyMapPoints, setBodyMapPoints] = useState<Array<{ id: string; x: number; y: number; type: string }>>([]);

  // Default values for the form
  const defaultValues: Partial<EventLogFormValues> = {
    eventType: "client",
    date: new Date(),
    time: format(new Date(), "HH:mm"),
    injuryOccurred: "no",
    referredToSafeguarding: "no",
    reportedToPolice: "no",
    reportedToRegulator: "no",
    followUpRequired: "no",
    status: "Draft",
    visibleToClient: false,
  };

  const form = useForm<EventLogFormValues>({
    resolver: zodResolver(eventLogFormSchema),
    defaultValues,
  });
  
  const eventType = form.watch("eventType");
  
  const onSubmit = async (data: EventLogFormValues) => {
    try {
      // We would normally send this data to the server
      console.log("Form data:", data);
      console.log("Actions:", actions);
      console.log("Attachments:", attachments);
      console.log("Body map points:", bodyMapPoints);

      // Show success toast
      toast.success("Event log saved successfully!");
      
      // Reset the form
      form.reset(defaultValues);
      setActions([]);
      setAttachments([]);
      setBodyMapPoints([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save event log");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Event Type Selection */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Event & Log Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>This event relates to <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <RadioGroup 
                      onValueChange={field.onChange} 
                      defaultValue={field.value} 
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="client" />
                        <Label htmlFor="client">Client</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staff" id="staff" />
                        <Label htmlFor="staff">Staff</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {eventType === "client" ? (
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockClients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="staffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Staff Member <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input className="pl-10" placeholder="Enter location" {...field} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Date <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Time <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input className="pl-10" type="time" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="eventCategory"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Type of Event <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="medication_error">Medication Error</SelectItem>
                      <SelectItem value="safeguarding">Safeguarding</SelectItem>
                      <SelectItem value="complaint">Complaint</SelectItem>
                      <SelectItem value="compliment">Compliment</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Full Details <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide a detailed description of the event"
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Actions Section */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Actions</h3>
            <Button type="button" variant="outline" onClick={() => setActions([...actions, { id: crypto.randomUUID(), text: "", date: new Date() }])}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Action
            </Button>
          </div>
          
          <ActionsList actions={actions} setActions={setActions} />
        </div>

        {/* Attachments Section */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Attachments</h3>
            <Button type="button" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Add New Attachment
            </Button>
          </div>
          
          <AttachmentsList attachments={attachments} setAttachments={setAttachments} />
        </div>

        {/* Case Outcome */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <FormField
            control={form.control}
            name="caseOutcome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case Outcome</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe the outcome or resolution for this case"
                    className="min-h-[100px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Body Map/Injury Section */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Body Map / Injury</h3>
          
          <FormField
            control={form.control}
            name="injuryOccurred"
            render={({ field }) => (
              <FormItem className="space-y-3 mb-4">
                <FormLabel>Did an injury occur? <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <RadioGroup 
                    onValueChange={field.onChange} 
                    defaultValue={field.value} 
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="injury-yes" />
                      <Label htmlFor="injury-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="injury-no" />
                      <Label htmlFor="injury-no">No</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {form.watch("injuryOccurred") === "yes" && (
            <div className="mt-4">
              <BodyMapSelector bodyMapPoints={bodyMapPoints} setBodyMapPoints={setBodyMapPoints} />
            </div>
          )}
        </div>

        {/* Staff/People Details Section */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Staff & People Details</h3>
          
          <StaffDetailsSection 
            staff={mockStaff}
            form={form}
          />
        </div>

        {/* Referral & Follow-up Questions */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Referral & Follow-up</h3>
          
          <ReferralQuestions form={form} />
        </div>

        {/* Status & Visibility */}
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Status & Visibility</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Pending Review">Pending Review</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibleToClient"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Visible to Client
                    </FormLabel>
                    <FormDescription>
                      Allow the client to view this event/log record
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">
            Save Event Log
          </Button>
        </div>
      </form>
    </Form>
  );
}
