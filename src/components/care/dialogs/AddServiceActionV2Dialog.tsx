import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useBranchServices } from "@/data/hooks/useBranchServices";

const formSchema = z.object({
  type: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  instructions: z.string().optional(),
  writtenOutcome: z.string().optional(),
  serviceSpecific: z.string().optional(),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  untilDate: z.date().optional(),
  scheduleType: z.string().min(1, "Schedule type is required"),
  shifts: z.string().min(1, "Shifts is required"),
  days: z.array(z.string()).min(1, "At least one day must be selected"),
  interval: z.string().optional(),
});

interface AddServiceActionV2DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  clientId: string;
  carePlanId?: string;
  branchId?: string;
  isLoading?: boolean;
}

export const AddServiceActionV2Dialog: React.FC<AddServiceActionV2DialogProps> = ({
  open,
  onOpenChange,
  onSave,
  clientId,
  carePlanId,
  branchId,
  isLoading = false,
}) => {
  const { data: services } = useBranchServices(branchId);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "",
      title: "",
      instructions: "",
      writtenOutcome: "",
      serviceSpecific: "",
      scheduleType: "",
      shifts: "",
      days: [],
      interval: "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    // Format schedule details
    const scheduleDetails = `
Schedule: ${values.scheduleType}
Shifts: ${values.shifts}
Days: ${values.days.join(", ")}
${values.interval ? `Interval: ${values.interval}` : ""}
From: ${format(values.fromDate, "PPP")}
${values.untilDate ? `Until: ${format(values.untilDate, "PPP")}` : ""}
    `.trim();

    const formattedData = {
      client_id: clientId,
      care_plan_id: carePlanId || null,
      service_name: values.title,
      service_category: values.serviceSpecific || "general",
      provider_name: "Internal", // Default for now
      frequency: values.scheduleType,
      duration: values.shifts,
      schedule_details: scheduleDetails,
      goals: values.writtenOutcome ? [values.writtenOutcome] : [],
      progress_status: "active",
      start_date: values.fromDate.toISOString().split('T')[0],
      end_date: values.untilDate ? values.untilDate.toISOString().split('T')[0] : null,
      notes: values.instructions || null,
    };
    
    onSave(formattedData);
    form.reset();
    setSelectedDays([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
      setSelectedDays([]);
    }
    onOpenChange(newOpen);
  };

  const handleDayToggle = (day: string, checked: boolean) => {
    const newSelectedDays = checked 
      ? [...selectedDays, day]
      : selectedDays.filter(d => d !== day);
    
    setSelectedDays(newSelectedDays);
    form.setValue("days", newSelectedDays);
  };

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Service Action</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Type and Title */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border shadow-md z-[9999]">
                        <SelectItem value="existing">Existing</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      {form.watch("type") === "existing" ? (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select service" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-md z-[9999]">
                            {services?.map((service) => (
                              <SelectItem key={service.id} value={service.title}>
                                {service.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input placeholder="Enter title" {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter instructions..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Written Outcome */}
            <FormField
              control={form.control}
              name="writtenOutcome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Written Outcome</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter written outcome..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Specific */}
            <FormField
              control={form.control}
              name="serviceSpecific"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Specific</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select service specific" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background border shadow-md z-[9999]">
                      <SelectItem value="personal-care">Personal Care</SelectItem>
                      <SelectItem value="medical-care">Medical Care</SelectItem>
                      <SelectItem value="domestic-support">Domestic Support</SelectItem>
                      <SelectItem value="social-activities">Social Activities</SelectItem>
                      <SelectItem value="transportation">Transportation</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="mobility-assistance">Mobility Assistance</SelectItem>
                      <SelectItem value="medication-management">Medication Management</SelectItem>
                      <SelectItem value="safety-monitoring">Safety Monitoring</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Schedule Section */}
            <div className="space-y-4 border rounded-lg p-4">
              <h3 className="font-medium">Schedule</h3>
              
              {/* From and Until dates */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>From</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background",
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
                        <PopoverContent className="w-auto p-0 bg-background border shadow-md z-[9999]" align="start">
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
                  name="untilDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Until</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background",
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
                        <PopoverContent className="w-auto p-0 bg-background border shadow-md z-[9999]" align="start">
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
              </div>

              {/* Type and Shifts */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduleType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border shadow-md z-[9999]">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="as-needed">As Needed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shifts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shifts</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select shifts" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border shadow-md z-[9999]">
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                          <SelectItem value="full-day">Full Day</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Days checkboxes */}
              <FormField
                control={form.control}
                name="days"
                render={() => (
                  <FormItem>
                    <FormLabel>Days</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {weekDays.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={day}
                            checked={selectedDays.includes(day)}
                            onCheckedChange={(checked) => handleDayToggle(day, checked as boolean)}
                          />
                          <label
                            htmlFor={day}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {day.slice(0, 3)}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interval */}
              <FormField
                control={form.control}
                name="interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interval</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter interval (e.g., Every 2 weeks)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Service Action"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};