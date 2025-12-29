import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Medication form schema
const medicationSchema = z.object({
  source: z.enum(["nhs_database", "new_medication"]),
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  shape: z.string().min(1, "Shape is required"),
  route: z.string().optional(),
  who_administers: z.string().min(1, "Who administers is required"),
  level: z.string().min(1, "Level is required"),
  instruction: z.string().optional(),
  warning: z.string().optional(),
  side_effect: z.string().optional(),
  frequency: z.string().min(1, "Frequency is required"),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().optional(),
});

type MedicationFormData = z.infer<typeof medicationSchema>;

interface AddMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (medication: any) => void;
  onUpdate?: (medication: any) => void;
  mode?: 'add' | 'edit';
  initialMedication?: Partial<MedicationFormData> & { id?: string };
}

// NHS Database medications (simplified example)
const NHS_MEDICATIONS = [
  "Paracetamol", "Ibuprofen", "Aspirin", "Amoxicillin", "Simvastatin", 
  "Amlodipine", "Omeprazole", "Atorvastatin", "Levothyroxine", "Ramipril",
  "Metformin", "Losartan", "Bendroflumethiazide", "Lansoprazole", "Prednisolone"
];

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

export function AddMedicationDialog({ 
  isOpen, 
  onClose, 
  onSave, 
  onUpdate, 
  mode = 'add', 
  initialMedication 
}: AddMedicationDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMedications, setFilteredMedications] = useState<string[]>([]);
  const [selectedWeekDay, setSelectedWeekDay] = useState<string>("");
  const [selectedTimesOfDay, setSelectedTimesOfDay] = useState<string[]>([]);

  const form = useForm<MedicationFormData>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      source: "new_medication",
      name: "",
      dosage: "",
      shape: "",
      route: "",
      who_administers: "",
      level: "",
      instruction: "",
      warning: "",
      side_effect: "",
      frequency: "",
      start_date: new Date(),
    }
  });

  // Reset form when initialMedication changes
  React.useEffect(() => {
    if (initialMedication && mode === 'edit') {
      form.reset({
        source: "new_medication", // Always new_medication for local edits
        name: initialMedication.name || "",
        dosage: initialMedication.dosage || "",
        shape: initialMedication.shape || "",
        route: initialMedication.route || "",
        who_administers: initialMedication.who_administers || "",
        level: initialMedication.level || "",
        instruction: initialMedication.instruction || "",
        warning: initialMedication.warning || "",
        side_effect: initialMedication.side_effect || "",
        frequency: initialMedication.frequency || "",
        start_date: initialMedication.start_date ? new Date(initialMedication.start_date) : new Date(),
        end_date: initialMedication.end_date ? new Date(initialMedication.end_date) : undefined,
      });
    }
  }, [initialMedication, mode, form]);

  const watchedSource = form.watch("source");
  const watchedFrequency = form.watch("frequency");

  // Handle NHS database search
  const handleMedicationSearch = (query: string) => {
    setSearchQuery(query);
    form.setValue("name", query);
    
    if (query.trim()) {
      const filtered = NHS_MEDICATIONS.filter(med => 
        med.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      setFilteredMedications(filtered);
    } else {
      setFilteredMedications([]);
    }
  };

  const selectMedication = (medicationName: string) => {
    form.setValue("name", medicationName);
    setSearchQuery(medicationName);
    setFilteredMedications([]);
  };

  const handleSave = (data: MedicationFormData) => {
    // Combine frequency with weekday if weekly is selected
    let finalFrequency = data.frequency;
    if (data.frequency === "weekly" && selectedWeekDay) {
      finalFrequency = `weekly_${selectedWeekDay}`;
    }
    
    const medication = {
      id: mode === 'edit' && initialMedication?.id ? initialMedication.id : `med-${Date.now()}`,
      name: data.name,
      dosage: data.dosage,
      shape: data.shape,
      route: data.route,
      who_administers: data.who_administers,
      level: data.level,
      instruction: data.instruction || "",
      warning: data.warning || "",
      side_effect: data.side_effect || "",
      frequency: finalFrequency,
      time_of_day: selectedTimesOfDay.length > 0 ? selectedTimesOfDay : undefined,
      start_date: data.start_date.toISOString().split('T')[0],
      end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined,
      status: "active"
    };
    
    if (mode === 'edit' && onUpdate) {
      onUpdate(medication);
    } else if (onSave) {
      onSave(medication);
    }
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    setSearchQuery("");
    setFilteredMedications([]);
    setSelectedWeekDay("");
    setSelectedTimesOfDay([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Medication' : 'Add Medication'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            {/* Source Selection */}
            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nhs_database" id="nhs_database" />
                        <Label htmlFor="nhs_database">Medication From NHS Database</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new_medication" id="new_medication" />
                        <Label htmlFor="new_medication">New Medication</Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Medication Name/Search */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {watchedSource === "nhs_database" 
                      ? "Search NHS Database" 
                      : "Medication Name"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                        placeholder={
                          watchedSource === "nhs_database" 
                            ? "Type to search NHS database..." 
                            : "Enter medication name"
                        }
                        value={watchedSource === "nhs_database" ? searchQuery : field.value}
                        onChange={(e) => {
                          if (watchedSource === "nhs_database") {
                            handleMedicationSearch(e.target.value);
                          } else {
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                      {watchedSource === "nhs_database" && filteredMedications.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                          {filteredMedications.map(med => (
                            <div
                              key={med}
                              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                              onClick={() => selectMedication(med)}
                            >
                              {med}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <FormLabel>Shape *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormItem>
                  <FormLabel>Day of Week *</FormLabel>
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
              </div>
            )}

            {/* Time of Day selector - shown for daily frequencies */}
{(watchedFrequency === "once_daily" || 
                  watchedFrequency === "twice_daily" || 
                  watchedFrequency === "three_times_daily" || 
                  watchedFrequency === "four_times_daily" ||
                  watchedFrequency === "every_other_day" ||
                  watchedFrequency === "weekly" ||
                  watchedFrequency === "monthly") && (
              <div className="space-y-2">
                <FormLabel>Time of Day</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {TIME_OF_DAY_OPTIONS.map(option => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={selectedTimesOfDay.includes(option.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedTimesOfDay(prev => 
                          prev.includes(option.value) 
                            ? prev.filter(t => t !== option.value)
                            : [...prev, option.value]
                        );
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select when this medication should be taken
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Who Administers */}
              <FormField
                control={form.control}
                name="who_administers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Who Administers *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select administrator" />
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
                    <FormLabel>Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEVEL_OPTIONS.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
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
                    <FormLabel>End Date (Optional)</FormLabel>
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
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
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
                          disabled={(date) =>
                            date < new Date("1900-01-01")
                          }
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Instruction */}
            <FormField
              control={form.control}
              name="instruction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instruction</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Special instructions for administration..."
                      className="min-h-[60px]"
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
                  <FormLabel>Warning</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Important warnings or precautions..."
                      className="min-h-[60px]"
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
                  <FormLabel>Side Effect</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Potential side effects to monitor..."
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Medication
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}