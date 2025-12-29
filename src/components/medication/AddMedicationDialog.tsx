
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon, Clock, Plus, X, Loader2, Pill } from "lucide-react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBranchDashboardNavigation } from "@/hooks/useBranchDashboardNavigation";
import { useAuth } from "@/hooks/useAuth";

interface AddMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  client_id: z.string({
    required_error: "Client is required.",
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
  const [isCreatingCarePlan, setIsCreatingCarePlan] = useState(false);
  const createMedication = useCreateMedication();
  const queryClient = useQueryClient();
  const { id: branchId } = useBranchDashboardNavigation();
  const { user } = useAuth();

  // No need to fetch staff - we use auth user ID directly for created_by

  // Fetch all clients in the current branch with inclusive filtering
  const { data: clients = [] } = useQuery({
    queryKey: ['branch-clients-for-medication', branchId],
    queryFn: async () => {
      if (!branchId) return [];
      
      console.log('[AddMedicationDialog] Fetching clients for branch:', branchId);
      
      const { data, error } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          status,
          client_care_plans(
            id,
            title,
            status
          )
        `)
        .eq('branch_id', branchId)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('[AddMedicationDialog] Error fetching clients:', error);
        throw error;
      }
      
      // Filter out only clearly inactive clients
      const activeClients = data.filter(client => {
        const status = client.status?.toLowerCase();
        // Exclude only clearly inactive statuses
        return status !== 'former' && 
               status !== 'closed enquiries' && 
               status !== 'closed_enquiries' &&
               status !== 'inactive';
      });

      console.log(`[AddMedicationDialog] Found ${activeClients.length} active clients`);
      return activeClients;
    },
    enabled: !!branchId,
  });

  // Enhanced mutation to create a care plan with better error handling
  const createCarePlan = useMutation({
    mutationFn: async (clientId: string) => {
      console.log('[AddMedicationDialog] Creating care plan for client:', clientId);
      
      const client = clients.find(c => c.id === clientId);
      if (!client) {
        throw new Error('Client not found');
      }

       const { data, error } = await supabase
         .from('client_care_plans')
         .insert({
           client_id: clientId,
           title: `General Care Plan for ${client.first_name} ${client.last_name}`,
           provider_name: 'System Generated',
           start_date: new Date().toISOString().split('T')[0],
           status: 'active',
           display_id: `TEMP-${Date.now()}` // Temporary unique value, will be replaced by trigger
         })
        .select()
        .single();

      if (error) {
        console.error('[AddMedicationDialog] Error creating care plan:', error);
        throw new Error(`Failed to create care plan: ${error.message}`);
      }

      console.log('[AddMedicationDialog] Care plan created successfully:', data.id);
      return data;
    },
    onError: (error) => {
      console.error('[AddMedicationDialog] Care plan creation failed:', error);
    }
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
      console.log('[AddMedicationDialog] Starting medication creation process');
      
      const selectedClient = clients.find(c => c.id === values.client_id);
      if (!selectedClient) {
        toast.error('Selected client not found');
        return;
      }

      // Check if client has an active care plan
      let carePlan = selectedClient.client_care_plans?.find(cp => cp.status === 'active');
      
      // If no active care plan exists, create one
      if (!carePlan) {
        console.log('[AddMedicationDialog] No active care plan found, creating one');
        setIsCreatingCarePlan(true);
        
        try {
          carePlan = await createCarePlan.mutateAsync(values.client_id);
          
          // Wait a moment for the care plan to be fully committed
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Invalidate and refetch client data to ensure we have the latest care plan
          await queryClient.invalidateQueries({ queryKey: ['branch-clients-for-medication'] });
          
          console.log('[AddMedicationDialog] Care plan created, proceeding with medication');
        } catch (carePlanError) {
          console.error('[AddMedicationDialog] Failed to create care plan:', carePlanError);
          toast.error(`Failed to create care plan: ${carePlanError instanceof Error ? carePlanError.message : 'Unknown error'}`);
          return;
        } finally {
          setIsCreatingCarePlan(false);
        }
      }

      // Create the medication with retry logic
      console.log('[AddMedicationDialog] Creating medication for care plan:', carePlan.id);
      
      const medicationData = {
        care_plan_id: carePlan.id,
        name: values.name,
        dosage: values.dosage,
        frequency: values.frequency,
        time_of_day: selectedTimesOfDay.length > 0 ? selectedTimesOfDay : null,
        start_date: values.start_date.toISOString().split('T')[0],
        end_date: values.end_date?.toISOString().split('T')[0],
        status: values.status || "active",
        created_by: user?.id, // Use auth user ID directly
      };

      console.log('[AddMedicationDialog] Medication data:', medicationData);
      
      await createMedication.mutateAsync(medicationData);
      
      console.log('[AddMedicationDialog] Medication created successfully');
      form.reset();
      setSelectedTimesOfDay([]);
      toast.success(`Medication added successfully for ${selectedClient?.first_name} ${selectedClient?.last_name}`);
      onOpenChange(false);
      
    } catch (error) {
      console.error('[AddMedicationDialog] Error in medication creation process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to add medication: ${errorMessage}`);
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

  const TIME_OF_DAY_OPTIONS = [
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
    { value: "night", label: "Night" }
  ];

  const [selectedTimesOfDay, setSelectedTimesOfDay] = useState<string[]>([]);
  const watchedFrequency = form.watch("frequency");

  const isSubmitting = createMedication.isPending || createCarePlan.isPending || isCreatingCarePlan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Medication</DialogTitle>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Pill className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Medication Workflow</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Medications added here will automatically appear in the carer's visit workflow when they visit this client. 
                  Carers can then record administrations, which creates MAR (Medication Administration Record) entries.
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => {
                          const hasActivePlan = client.client_care_plans?.some(cp => cp.status === 'active');
                          const statusDisplay = client.status || 'No Status';
                          return (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                  <span>{client.last_name}, {client.first_name}</span>
                                  <span className="text-xs text-gray-500">Status: {statusDisplay}</span>
                                </div>
                                {!hasActivePlan && (
                                  <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                                    Will create plan
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {clients.length === 0 
                        ? "No active clients found in this branch"
                        : `${clients.length} clients available. Care plans will be created automatically if needed.`
                      }
                    </FormDescription>
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
                        <Input placeholder="Enter medication name" {...field} disabled={isSubmitting} />
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
                        <Input placeholder="e.g. 10mg, 1 tablet, 5ml" {...field} disabled={isSubmitting} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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

              {/* Time of Day selector - shown for daily frequencies */}
              {(watchedFrequency === "Once daily" || 
                watchedFrequency === "Twice daily" || 
                watchedFrequency === "Three times daily" || 
                watchedFrequency === "Four times daily") && (
                <FormItem>
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
                        disabled={isSubmitting}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  <FormDescription>
                    Select when this medication should be taken
                  </FormDescription>
                </FormItem>
              )}
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
                              disabled={isSubmitting}
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
                              disabled={isSubmitting}
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

            {isCreatingCarePlan && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">Creating care plan for patient...</span>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isCreatingCarePlan ? "Creating Care Plan..." : "Adding Medication..."}
                  </>
                ) : (
                  "Add Medication"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
