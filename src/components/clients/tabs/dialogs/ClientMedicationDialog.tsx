import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useClientCarePlans } from "@/hooks/useClientData";
import { useCreateMedication, useUpdateMedication } from "@/hooks/useMedications";

const clientMedicationSchema = z.object({
  care_plan_id: z.string().uuid("Please select a care plan"),
  name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  start_date: z.date({ required_error: "Start date is required" }),
  end_date: z.date().optional(),
  notes: z.string().optional(),
  status: z.string().default("active")
});

type FormData = z.infer<typeof clientMedicationSchema>;

interface ClientMedicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  mode: 'add' | 'edit' | 'view';
  medication?: any;
}

const frequencyOptions = [
  { value: "once_daily", label: "Once Daily" },
  { value: "twice_daily", label: "Twice Daily" },
  { value: "three_times_daily", label: "Three Times Daily" },
  { value: "four_times_daily", label: "Four Times Daily" },
  { value: "as_needed", label: "As Needed (PRN)" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "discontinued", label: "Discontinued" },
];

export function ClientMedicationDialog({
  isOpen,
  onClose,
  clientId,
  mode,
  medication
}: ClientMedicationDialogProps) {
  const { data: carePlans = [], isLoading: carePlansLoading } = useClientCarePlans(clientId);
  const createMedication = useCreateMedication();
  const updateMedication = useUpdateMedication();

  const form = useForm<FormData>({
    resolver: zodResolver(clientMedicationSchema),
    defaultValues: {
      care_plan_id: "",
      name: "",
      dosage: "",
      frequency: "",
      start_date: undefined,
      end_date: undefined,
      notes: "",
      status: "active"
    }
  });

  // Reset form when dialog opens or medication changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' || mode === 'view') {
        if (medication) {
          form.reset({
            care_plan_id: medication.care_plan_id,
            name: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            start_date: new Date(medication.start_date),
            end_date: medication.end_date ? new Date(medication.end_date) : undefined,
            notes: medication.notes || "",
            status: medication.status || "active"
          });
        }
      } else {
        // Add mode - auto-select care plan if only one exists
        const activeCarePlans = carePlans.filter((cp: any) => cp.status === 'confirmed');
        form.reset({
          care_plan_id: activeCarePlans.length === 1 ? activeCarePlans[0].id : "",
          name: "",
          dosage: "",
          frequency: "",
          start_date: undefined,
          end_date: undefined,
          notes: "",
          status: "active"
        });
      }
    }
  }, [isOpen, mode, medication, carePlans, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const medicationData = {
        care_plan_id: data.care_plan_id,
        name: data.name,
        dosage: data.dosage,
        frequency: data.frequency,
        start_date: format(data.start_date, 'yyyy-MM-dd'),
        end_date: data.end_date ? format(data.end_date, 'yyyy-MM-dd') : undefined,
        status: data.status,
        notes: data.notes
      };

      if (mode === 'edit' && medication) {
        await updateMedication.mutateAsync({
          id: medication.id,
          ...medicationData
        });
        toast.success("Medication updated successfully");
      } else {
        await createMedication.mutateAsync(medicationData);
        toast.success("Medication added successfully");
      }
      
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save medication");
    }
  };

  const activeCarePlans = carePlans.filter((cp: any) => cp.status === 'confirmed');
  const hasNoCarePlans = activeCarePlans.length === 0;
  const isViewMode = mode === 'view';
  const isLoading = createMedication.isPending || updateMedication.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' && 'Add New Medication'}
            {mode === 'edit' && 'Edit Medication'}
            {mode === 'view' && 'Medication Details'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add' && 'Add a new medication to the client\'s care plan'}
            {mode === 'edit' && 'Update medication information'}
            {mode === 'view' && 'View medication details'}
          </DialogDescription>
        </DialogHeader>

        {hasNoCarePlans && !isViewMode ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              This client has no active care plans. Please create a care plan first before adding medications.
            </p>
            <Button onClick={onClose} variant="outline">Close</Button>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="care_plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Care Plan *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isViewMode || carePlansLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select care plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeCarePlans.map((cp: any) => (
                          <SelectItem key={cp.id} value={cp.id}>
                            {cp.title}
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Name *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isViewMode} placeholder="e.g., Paracetamol" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage *</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isViewMode} placeholder="e.g., 500mg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isViewMode}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {frequencyOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isViewMode}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isViewMode}
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
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isViewMode}
                            >
                              {field.value ? format(field.value, "PPP") : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={isViewMode}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isViewMode}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes / Prescribed By</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={isViewMode}
                        placeholder="Add any additional notes or who prescribed this medication..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  {isViewMode ? 'Close' : 'Cancel'}
                </Button>
                {!isViewMode && (
                  <Button type="submit" disabled={isLoading || hasNoCarePlans}>
                    {isLoading ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'} Medication
                  </Button>
                )}
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
