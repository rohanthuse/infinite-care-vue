import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUpdateMedication } from "@/hooks/useMedications";
import { toast } from "sonner";

const editMedicationSchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"), 
  frequency: z.string().min(1, "Frequency is required"),
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
}

interface EditPersistedMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  medication: Medication | null;
}

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

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" }
];

export function EditPersistedMedicationDialog({ isOpen, onClose, medication }: EditPersistedMedicationDialogProps) {
  const updateMedicationMutation = useUpdateMedication();
  const [selectedWeekDay, setSelectedWeekDay] = React.useState<string>("");

  const form = useForm<EditMedicationFormData>({
    resolver: zodResolver(editMedicationSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
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
        start_date: new Date(medication.start_date),
        end_date: medication.end_date ? new Date(medication.end_date) : undefined,
        status: medication.status || "active"
      });
      setSelectedWeekDay(weekDay);
    }
  }, [medication, form]);

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
    onClose();
  };

  if (!medication) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter medication name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Dosage */}
            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 500mg" {...field} />
                  </FormControl>
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
                  <FormLabel>Frequency</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMedicationMutation.isPending}>
                {updateMedicationMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}