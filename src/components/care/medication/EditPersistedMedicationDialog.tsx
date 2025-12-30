import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUpdateMedication } from "@/hooks/useMedications";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const editMedicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"), 
  frequency: z.string().min(1, "Frequency is required"),
  shape: z.string().optional(),
  route: z.string().optional(),
  who_administers: z.string().optional(),
  level: z.string().optional(),
  instruction: z.string().optional(),
  warning: z.string().optional(),
  side_effect: z.string().optional(),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().optional(),
  status: z.string().min(1, "Status is required")
});

type EditMedicationFormData = z.infer<typeof editMedicationSchema>;

interface Medication {
  id?: string;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  status?: string;
  shape?: string;
  route?: string;
  who_administers?: string;
  level?: string;
  instruction?: string;
  warning?: string;
  side_effect?: string;
  time_of_day?: string[];
}

interface EditPersistedMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

const MEDICATION_SHAPES = [
  "Tablet", "Capsule", "Liquid", "Gel", "Injection", "Patch", "Inhaler", 
  "Drops", "Cream", "Ointment", "Spray", "Suppository"
];

const MEDICATION_ROUTES = [
  "Oral", "Topical", "Intravenous", "Intramuscular", "Subcutaneous", 
  "Inhalation", "Rectal", "Transdermal", "Sublingual", "Buccal"
];

const WHO_ADMINISTERS_OPTIONS = [
  "Self-administered", "Carer assistance", "Nurse administration", 
  "Family member", "Healthcare professional"
];

const LEVEL_OPTIONS = [
  "Level 1 - Simple reminder",
  "Level 2 - Prompting required", 
  "Level 3 - Partial assistance",
  "Level 4 - Full assistance"
];

const FREQUENCY_OPTIONS = [
  { value: "once_daily", label: "Once daily" },
  { value: "twice_daily", label: "Twice daily" },
  { value: "three_times_daily", label: "Three times daily" },
  { value: "four_times_daily", label: "Four times daily" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as_needed", label: "As needed (PRN)" }
];

const WEEKDAY_OPTIONS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" }
];

const TIME_OF_DAY_OPTIONS = [
  { value: "morning", label: "Morning", description: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", description: "12 PM - 5 PM" },
  { value: "evening", label: "Evening", description: "5 PM - 9 PM" },
  { value: "night", label: "Night", description: "9 PM - 6 AM" }
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" }
];

export function EditPersistedMedicationDialog({ isOpen, onClose, medication }: EditPersistedMedicationDialogProps) {
  const updateMedicationMutation = useUpdateMedication();
  const [selectedWeekDay, setSelectedWeekDay] = React.useState<string>("");
  const [selectedTimesOfDay, setSelectedTimesOfDay] = React.useState<string[]>([]);

  const form = useForm<EditMedicationFormData>({
    resolver: zodResolver(editMedicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      shape: "",
      route: "",
      who_administers: "",
      level: "",
      instruction: "",
      warning: "",
      side_effect: "",
      start_date: new Date(),
      status: "active"
    }
  });

  const watchedFrequency = form.watch("frequency");

  // Reset form when medication changes
  React.useEffect(() => {
    if (medication) {
      // Parse frequency - check if it's weekly_day format
      let frequency = medication.frequency;
      let weekDay = "";
      if (frequency.startsWith("weekly_")) {
        weekDay = frequency.split("_")[1];
        frequency = "weekly";
      }
      
      form.reset({
        name: medication.name,
        dosage: medication.dosage,
        frequency: frequency,
        shape: medication.shape || "",
        route: medication.route || "",
        who_administers: medication.who_administers || "",
        level: medication.level || "",
        instruction: medication.instruction || "",
        warning: medication.warning || "",
        side_effect: medication.side_effect || "",
        start_date: new Date(medication.start_date),
        end_date: medication.end_date ? new Date(medication.end_date) : undefined,
        status: medication.status || "active"
      });
      setSelectedWeekDay(weekDay);
      setSelectedTimesOfDay(medication.time_of_day || []);
    }
  }, [medication, form]);

  const toggleTimeOfDay = (value: string) => {
    setSelectedTimesOfDay(prev => 
      prev.includes(value) 
        ? prev.filter(t => t !== value) 
        : [...prev, value]
    );
  };

  const handleSave = (data: EditMedicationFormData) => {
    if (!medication?.id) return;

    // Combine frequency with weekday if weekly is selected
    let finalFrequency = data.frequency;
    if (data.frequency === "weekly" && selectedWeekDay) {
      finalFrequency = `weekly_${selectedWeekDay}`;
    }

    updateMedicationMutation.mutate({
      id: medication.id,
      name: data.name,
      dosage: data.dosage,
      frequency: finalFrequency,
      shape: data.shape || null,
      route: data.route || null,
      who_administers: data.who_administers || null,
      level: data.level || null,
      instruction: data.instruction || null,
      warning: data.warning || null,
      side_effect: data.side_effect || null,
      time_of_day: selectedTimesOfDay.length > 0 ? selectedTimesOfDay : null,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : null,
      status: data.status
    }, {
      onSuccess: () => {
        toast.success("Medication updated successfully");
        onClose();
      },
      onError: (error) => {
        console.error("Failed to update medication:", error);
        toast.error("Failed to update medication");
      }
    });
  };

  const handleClose = () => {
    form.reset();
    setSelectedWeekDay("");
    setSelectedTimesOfDay([]);
    onClose();
  };

  if (!medication) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter medication name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dosage */}
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 500mg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Shape */}
                <FormField
                  control={form.control}
                  name="shape"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shape</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shape" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEDICATION_SHAPES.map(shape => (
                            <SelectItem key={shape} value={shape}>{shape}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Route */}
                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select route" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEDICATION_ROUTES.map(route => (
                            <SelectItem key={route} value={route}>{route}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Frequency */}
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map(freq => (
                            <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Weekday selector for Weekly frequency */}
              {watchedFrequency === "weekly" && (
                <FormItem>
                  <FormLabel>Day of Week</FormLabel>
                  <Select value={selectedWeekDay} onValueChange={setSelectedWeekDay}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_OPTIONS.map(day => (
                        <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}

              {/* Time of Day */}
              <FormItem>
                <FormLabel>Time of Day</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TIME_OF_DAY_OPTIONS.map(time => (
                    <Button
                      key={time.value}
                      type="button"
                      variant={selectedTimesOfDay.includes(time.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleTimeOfDay(time.value)}
                      className="flex flex-col h-auto py-2"
                    >
                      <span>{time.label}</span>
                      <span className="text-xs opacity-70">{time.description}</span>
                    </Button>
                  ))}
                </div>
              </FormItem>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Who Administers */}
                <FormField
                  control={form.control}
                  name="who_administers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Who Administers</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select who administers" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {WHO_ADMINISTERS_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Level */}
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEVEL_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date *</FormLabel>
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
                              {field.value ? (
                                format(field.value, "MMM d, yyyy")
                              ) : (
                                <span>Pick date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
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
                              {field.value ? (
                                format(field.value, "MMM d, yyyy")
                              ) : (
                                <span>Optional</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status */}
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
                        {STATUS_OPTIONS.map(status => (
                          <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Instruction */}
              <FormField
                control={form.control}
                name="instruction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any specific instructions..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Warning */}
              <FormField
                control={form.control}
                name="warning"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warnings</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any warnings..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Side Effect */}
              <FormField
                control={form.control}
                name="side_effect"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Side Effects</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any known side effects..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMedicationMutation.isPending}>
                  {updateMedicationMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
