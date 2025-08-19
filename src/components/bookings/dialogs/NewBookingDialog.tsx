import React, { useState, useEffect } from "react";
import { format, parseISO, addDays, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, X, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useBranchClients } from "@/data/hooks/useBranchClients";

const newBookingSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  carerId: z.string().min(1, "Carer is required"),
  services: z.array(z.string()).min(1, "At least one service is required"),
  fromDate: z.date(),
  untilDate: z.date(),
  schedules: z.array(z.object({
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    days: z.object({
      mon: z.boolean().optional(),
      tue: z.boolean().optional(),
      wed: z.boolean().optional(),
      thu: z.boolean().optional(),
      fri: z.boolean().optional(),
      sat: z.boolean().optional(),
      sun: z.boolean().optional(),
    }),
    services: z.array(z.string()),
  })).min(1, "At least one schedule is required"),
  notes: z.string().optional(), // Add notes field
});

type NewBookingFormData = z.infer<typeof newBookingSchema>;

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients?: Array<{ id: string; name: string; initials: string }>;
  carers: Array<{ id: string; name: string; initials: string }>;
  services: Array<{ id: string; title: string }>;
  onCreateBooking: (bookingData: any, carers?: any[]) => void;
  initialData?: {
    date: Date;
    startTime: string;
    clientId?: string;
    carerId?: string;
  } | null;
  isCreating?: boolean;
  branchId?: string;
  prefilledData?: any;
  preSelectedClientId?: string;
}

export function NewBookingDialog({
  open,
  onOpenChange,
  clients = [],
  carers,
  services,
  onCreateBooking,
  initialData,
  isCreating = false,
  branchId,
  prefilledData,
  preSelectedClientId,
}: NewBookingDialogProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const form = useForm<NewBookingFormData>({
    resolver: zodResolver(newBookingSchema),
    defaultValues: {
      clientId: "",
      carerId: "",
      services: [],
      fromDate: new Date(),
      untilDate: new Date(),
      schedules: [{
        startTime: "09:00",
        endTime: "10:00",
        days: { mon: true, tue: true, wed: true, thu: true, fri: true },
        services: [],
      }],
      notes: "", // Initialize notes
    },
  });

  // Update form when initialData changes
  useEffect(() => {
    if (initialData && open) {
      form.setValue("fromDate", initialData.date);
      form.setValue("untilDate", initialData.date);
      form.setValue("schedules", [{
        startTime: initialData.startTime,
        endTime: "10:00",
        days: { mon: true, tue: true, wed: true, thu: true, fri: true },
        services: [],
      }]);
      
      if (initialData.clientId) {
        form.setValue("clientId", initialData.clientId);
      }
      if (initialData.carerId) {
        form.setValue("carerId", initialData.carerId);
      }
    }
  }, [initialData, open, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setSelectedServices([]);
    }
  }, [open, form]);

  const onSubmit = (data: NewBookingFormData) => {
    console.log("[NewBookingDialog] Form submitted with data:", data);
    
    // Pass the complete data including notes
    const bookingData = {
      ...data,
      schedules: data.schedules.map(schedule => ({
        ...schedule,
        services: selectedServices,
      })),
    };
    
    onCreateBooking(bookingData, carers);
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
    
    // Update form services field
    const currentServices = selectedServices.includes(serviceId) 
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];
    
    form.setValue("services", currentServices);
  };

  const addSchedule = () => {
    const currentSchedules = form.getValues("schedules");
    form.setValue("schedules", [
      ...currentSchedules,
      {
        startTime: "09:00",
        endTime: "10:00",
        days: { mon: true, tue: true, wed: true, thu: true, fri: true },
        services: selectedServices,
      }
    ]);
  };

  const removeSchedule = (index: number) => {
    const currentSchedules = form.getValues("schedules");
    if (currentSchedules.length > 1) {
      form.setValue("schedules", currentSchedules.filter((_, i) => i !== index));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Create New Booking
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a new booking appointment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Client and Carer Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
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

              <FormField
                control={form.control}
                name="carerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a carer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carers.map((carer) => (
                          <SelectItem key={carer.id} value={carer.id}>
                            {carer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Services Selection */}
            <div className="space-y-3">
              <FormLabel>Services</FormLabel>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-3">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => handleServiceToggle(service.id)}
                    />
                    <label
                      htmlFor={service.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {service.title}
                    </label>
                  </div>
                ))}
              </div>
              {selectedServices.length === 0 && (
                <p className="text-sm text-red-500">At least one service is required</p>
              )}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Date</FormLabel>
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
                          disabled={(date) => date < new Date()}
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
                name="untilDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Until Date</FormLabel>
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
                          disabled={(date) => date < form.getValues("fromDate")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Schedules */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Schedules</FormLabel>
                <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                  Add Schedule
                </Button>
              </div>
              
              {form.watch("schedules").map((schedule, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Schedule {index + 1}</h4>
                    {form.watch("schedules").length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`schedules.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Days Selection */}
                  <div className="space-y-2">
                    <FormLabel>Days</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'mon', label: 'Mon' },
                        { key: 'tue', label: 'Tue' },
                        { key: 'wed', label: 'Wed' },
                        { key: 'thu', label: 'Thu' },
                        { key: 'fri', label: 'Fri' },
                        { key: 'sat', label: 'Sat' },
                        { key: 'sun', label: 'Sun' },
                      ].map((day) => (
                        <FormField
                          key={day.key}
                          control={form.control}
                          name={`schedules.${index}.days.${day.key as keyof typeof schedule.days}`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {day.label}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes or instructions for this booking..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Booking"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
