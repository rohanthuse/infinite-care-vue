
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useCreateMedication } from "@/hooks/useMedications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  care_plan_id: z.string({
    required_error: "Care plan is required.",
  }),
  name: z.string().min(2, {
    message: "Medication name must be at least 2 characters.",
  }),
  dosage: z.string().min(1, {
    message: "Dosage is required.",
  }),
  frequency: z.string().min(1, {
    message: "Frequency is required.",
  }),
  start_date: z.date({
    required_error: "Start date is required.",
  }),
  end_date: z.date().optional(),
  status: z.string().default("active"),
});

type FormData = z.infer<typeof formSchema>;

export const AddMedicationDialog = ({ open, onOpenChange }: AddMedicationDialogProps) => {
  const createMedication = useCreateMedication();

  // Fetch care plans for dropdown
  const { data: carePlans = [] } = useQuery({
    queryKey: ['care-plans-for-medication'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_care_plans')
        .select(`
          id,
          title,
          display_id,
          clients(
            id,
            first_name,
            last_name
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      dosage: "",
      frequency: "",
      status: "active",
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      // Ensure care_plan_id is always present
      const medicationData = {
        care_plan_id: values.care_plan_id,
        name: values.name,
        dosage: values.dosage,
        frequency: values.frequency,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: values.end_date?.toISOString().split('T')[0],
        status: values.status || "active",
      };
      
      await createMedication.mutateAsync(medicationData);
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating medication:', error);
    }
  };

  const frequencyOptions = [
    { value: "Once daily", label: "Once daily" },
    { value: "Twice daily", label: "Twice daily" },
    { value: "Three times daily", label: "Three times daily" },
    { value: "Four times daily", label: "Four times daily" },
    { value: "Every other day", label: "Every other day" },
    { value: "Weekly", label: "Weekly" },
    { value: "As needed", label: "As needed (PRN)" },
    { value: "Before meals", label: "Before meals" },
    { value: "After meals", label: "After meals" },
    { value: "At bedtime", label: "At bedtime" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Medication</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="care_plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient / Care Plan*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient and care plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carePlans.map((carePlan) => (
                          <SelectItem key={carePlan.id} value={carePlan.id}>
                            {carePlan.clients?.first_name} {carePlan.clients?.last_name} - {carePlan.title} ({carePlan.display_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Medication Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medication Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter medication name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dosage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dosage*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 10mg, 1 tablet, 5ml" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Duration</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
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
                            initialFocus
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
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
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
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Leave empty for ongoing medication
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMedication.isPending}>
                {createMedication.isPending ? "Adding..." : "Add Medication"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
