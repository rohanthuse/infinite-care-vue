
import React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface RequestAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define the form schema using Zod
const formSchema = z.object({
  serviceType: z.string({
    required_error: "Please select a service type",
  }),
  date: z.date({
    required_error: "Appointment date is required",
  }),
  timeHour: z.string({
    required_error: "Please select an hour",
  }),
  timeMinute: z.string({
    required_error: "Please select a minute",
  }),
  timePeriod: z.string({
    required_error: "Please select AM/PM",
  }),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const RequestAppointmentDialog: React.FC<RequestAppointmentDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  
  // Initialize the form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      serviceType: "",
      date: new Date(new Date().setDate(new Date().getDate() + 3)), // Default to 3 days from now
      timeHour: "10",
      timeMinute: "00",
      timePeriod: "AM",
      location: "",
      notes: "",
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;

  // Service types aligned with other interfaces
  const serviceTypes = [
    "Therapy Session", 
    "Consultation", 
    "Check-up", 
    "Follow-up", 
    "Specialist Appointment",
    "Mental Health Assessment",
    "Physical Assessment",
    "Home Visit",
    "Emergency Appointment"
  ];
  
  // Available hours
  const hours = ["9", "10", "11", "12", "1", "2", "3", "4", "5"];
  
  // Available minutes
  const minutes = ["00", "15", "30", "45"];
  
  // Available locations
  const locations = [
    "Main Clinic, Room 204",
    "Neurology Department, Floor 3",
    "Physical Therapy Center",
    "Video Call",
    "Home Visit",
    "Other (Please specify in notes)"
  ];

  const onSubmit = async (values: FormValues) => {
    // Format the time for display
    const formattedTime = `${values.timeHour}:${values.timeMinute} ${values.timePeriod}`;
    
    // Simulate API call
    try {
      // Wait for 1 second to simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close the dialog
      onOpenChange(false);
      
      // Show success toast
      toast({
        title: "Appointment Requested",
        description: `Your ${values.serviceType} appointment has been requested for ${format(values.date, "MMMM d, yyyy")} at ${formattedTime}. You will receive a confirmation shortly.`,
      });
      
      // Reset form
      form.reset({
        serviceType: "",
        date: new Date(new Date().setDate(new Date().getDate() + 3)),
        timeHour: "10",
        timeMinute: "00",
        timePeriod: "AM",
        location: "",
        notes: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error requesting your appointment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Request New Appointment</DialogTitle>
          <DialogDescription>
            Please fill in the details for your appointment request. Our staff will review your request and confirm the appointment shortly.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Service Type */}
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">
                    Service Type <span className="text-red-500 dark:text-red-400">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                      {serviceTypes.map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="font-medium">
                    Preferred Date <span className="text-red-500 dark:text-red-400">*</span>
                  </FormLabel>
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
                          {field.value ? format(field.value, "PPP") : <span>Select a date</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Time Selection */}
            <div className="space-y-2">
              <FormLabel className="font-medium">
                Preferred Time <span className="text-red-500 dark:text-red-400">*</span>
              </FormLabel>
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="timeHour"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hours.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
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
                  name="timeMinute"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Min" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {minutes.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
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
                  name="timePeriod"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="AM/PM" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Location Preference */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Preferred Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a preferred location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[200px]">
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide any details about your appointment request..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-2">
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
