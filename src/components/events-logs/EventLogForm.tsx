import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { 
  CalendarIcon, 
  Clock, 
  MapPin, 
  Upload, 
  User, 
  Users, 
  X, 
  FileText, 
  PlusCircle, 
  ChevronDown, 
  ChevronUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { StaffDetailsSection } from "./StaffDetailsSection";
import { ActionsList } from "./ActionsList";
import { AttachmentsList } from "./AttachmentsList";
import { BodyMapSelector } from "./BodyMapSelector";

const mockClients = [
  { id: "CL001", name: "Aderinsola Thomas" },
  { id: "CL002", name: "James Wilson" },
  { id: "CL003", name: "Sophia Martinez" },
  { id: "CL004", name: "Michael Johnson" },
  { id: "CL005", name: "Emma Williams" },
  { id: "CL006", name: "Daniel Smith" }
];

const mockStaff = [
  { id: "ST001", name: "Alex Chen" },
  { id: "ST002", name: "Maria Rodriguez" },
  { id: "ST003", name: "John Williams" },
  { id: "ST004", name: "Sarah Johnson" },
  { id: "ST005", name: "David Brown" }
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    actions: false,
    attachments: false,
    bodyMap: false,
    staffDetails: false,
    referral: false,
    caseOutcome: false,
    status: false
  });

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
  const injuryOccurred = form.watch("injuryOccurred");
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };
  
  const onSubmit = async (data: EventLogFormValues) => {
    try {
      setIsSubmitting(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Form data:", data);
      console.log("Actions:", actions);
      console.log("Attachments:", attachments);
      console.log("Body map points:", bodyMapPoints);

      toast.success("Event log saved successfully!");
      
      form.reset(defaultValues);
      setActions([]);
      setAttachments([]);
      setBodyMapPoints([]);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save event log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const SectionHeader = ({ title, isExpanded, sectionKey }: { title: string; isExpanded: boolean; sectionKey: string }) => (
    <div 
      className="flex justify-between items-center cursor-pointer py-2 hover:bg-gray-50 -mx-6 px-6"
      onClick={() => toggleSection(sectionKey)}
    >
      <h3 className="text-lg font-medium">{title}</h3>
      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Event & Log Details" 
            isExpanded={expandedSections.details}
            sectionKey="details" 
          />
          
          {expandedSections.details && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                        <SelectContent className="z-[100]">
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
                        <SelectContent className="z-[100]">
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
                        <PopoverContent className="w-auto p-0 z-[100]" align="start">
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
                      <SelectContent className="z-[100]">
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
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Body Map / Injury" 
            isExpanded={expandedSections.bodyMap}
            sectionKey="bodyMap" 
          />
          
          {expandedSections.bodyMap && (
            <div className="mt-4">
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
              
              {injuryOccurred === "yes" && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <p className="text-sm text-gray-500">Body map selection will be implemented here</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Actions" 
            isExpanded={expandedSections.actions}
            sectionKey="actions" 
          />
          
          {expandedSections.actions && (
            <div className="mt-4">
              <div className="flex justify-end mb-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setActions([...actions, { id: crypto.randomUUID(), text: "", date: new Date() }])}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Action
                </Button>
              </div>
              
              <div className="space-y-4">
                {actions.length > 0 ? (
                  actions.map((action, index) => (
                    <Card key={action.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <Label htmlFor={`action-${index}`}>Action</Label>
                            <Textarea 
                              id={`action-${index}`}
                              placeholder="Describe the action"
                              className="mt-1" 
                              value={action.text}
                              onChange={(e) => {
                                const updatedActions = [...actions];
                                updatedActions[index].text = e.target.value;
                                setActions(updatedActions);
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`action-date-${index}`}>Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id={`action-date-${index}`}
                                  variant="outline"
                                  className="w-full mt-1 pl-3 text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {format(action.date, "PPP")}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={action.date}
                                  onSelect={(date) => {
                                    if (date) {
                                      const updatedActions = [...actions];
                                      updatedActions[index].date = date;
                                      setActions(updatedActions);
                                    }
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            const updatedActions = actions.filter((_, i) => i !== index);
                            setActions(updatedActions);
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">No actions added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Attachments" 
            isExpanded={expandedSections.attachments}
            sectionKey="attachments" 
          />
          
          {expandedSections.attachments && (
            <div className="mt-4">
              <div className="flex justify-end mb-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    const mockFile = {
                      id: crypto.randomUUID(),
                      name: `File-${attachments.length + 1}.pdf`,
                      type: "application/pdf",
                      size: Math.floor(Math.random() * 1000000)
                    };
                    setAttachments([...attachments, mockFile]);
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Add New Attachment
                </Button>
              </div>
              
              <div className="space-y-2">
                {attachments.length > 0 ? (
                  attachments.map((file, index) => (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-3 border rounded-md bg-white"
                    >
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-500 mr-2" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          const updatedAttachments = attachments.filter((_, i) => i !== index);
                          setAttachments(updatedAttachments);
                        }}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border border-dashed border-gray-300 rounded-md">
                    <p className="text-gray-500">No attachments added yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Case Outcome" 
            isExpanded={expandedSections.caseOutcome}
            sectionKey="caseOutcome" 
          />
          
          {expandedSections.caseOutcome && (
            <div className="mt-4">
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
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Staff & People Details" 
            isExpanded={expandedSections.staffDetails}
            sectionKey="staffDetails" 
          />
          
          {expandedSections.staffDetails && (
            <div className="mt-4">
              <StaffDetailsSection staff={mockStaff} form={form} />
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Referral & Follow-up" 
            isExpanded={expandedSections.referral}
            sectionKey="referral" 
          />
          
          {expandedSections.referral && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="referredToSafeguarding"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Referred to Safeguarding?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="safeguarding-yes" />
                          <Label htmlFor="safeguarding-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="safeguarding-no" />
                          <Label htmlFor="safeguarding-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportedToPolice"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Reported to Police?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="police-yes" />
                          <Label htmlFor="police-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="police-no" />
                          <Label htmlFor="police-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reportedToRegulator"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Reported to Regulator?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="regulator-yes" />
                          <Label htmlFor="regulator-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="regulator-no" />
                          <Label htmlFor="regulator-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="followUpRequired"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Follow-up Required?</FormLabel>
                    <FormControl>
                      <RadioGroup 
                        onValueChange={field.onChange} 
                        defaultValue={field.value} 
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="followup-yes" />
                          <Label htmlFor="followup-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="followup-no" />
                          <Label htmlFor="followup-no">No</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <SectionHeader 
            title="Status & Visibility" 
            isExpanded={expandedSections.status}
            sectionKey="status" 
          />
          
          {expandedSections.status && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectContent className="z-[100]">
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
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
          )}
        </div>

        <div className="flex justify-end space-x-4 sticky bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-md z-40">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Event Log"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
