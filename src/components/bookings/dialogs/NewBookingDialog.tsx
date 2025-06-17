import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const scheduleSchema = z.object({
  startTime: z.string().min(5, { message: "Start time required" }),
  endTime: z.string().min(5, { message: "End time required" }),
  services: z.array(z.string()).optional(),
  mon: z.boolean().optional(),
  tue: z.boolean().optional(),
  wed: z.boolean().optional(),
  thu: z.boolean().optional(),
  fri: z.boolean().optional(),
  sat: z.boolean().optional(),
  sun: z.boolean().optional(),
});

const formSchema = z.object({
  clientId: z.string().min(1, { message: "Client ID required" }),
  carerId: z.string().min(1, { message: "Carer ID required" }),
  fromDate: z.date({
    required_error: "A date is required.",
  }),
  untilDate: z.date({
    required_error: "A date is required.",
  }),
  schedules: z.array(scheduleSchema).min(1, { message: "At least one schedule is required" }),
});

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateBooking: (data: any, carers: any[]) => void;
  carers: Array<{ id: string; name?: string; first_name?: string; last_name?: string; initials?: string }>;
  services: Array<{ id: string; title: string }>;
  branchId?: string;
  prefilledData?: {
    date?: Date;
    startTime?: string;
    clientId?: string;
    carerId?: string;
  };
  preSelectedClientId?: string;
}

export function NewBookingDialog({
  open,
  onOpenChange,
  onCreateBooking,
  carers,
  services,
  branchId,
  prefilledData,
  preSelectedClientId,
}: NewBookingDialogProps) {
  const [scheduleCount, setScheduleCount] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      carerId: "",
      fromDate: prefilledData?.date || new Date(),
      untilDate: prefilledData?.date || new Date(),
      schedules: [
        {
          startTime: prefilledData?.startTime || "09:00",
          endTime: "17:00",
          services: [],
          mon: true,
          tue: true,
          wed: true,
          thu: true,
          fri: true,
          sat: false,
          sun: false,
        },
      ],
    },
  });

  useEffect(() => {
    if (open && preSelectedClientId) {
      form.setValue("clientId", preSelectedClientId);
    }
  }, [open, preSelectedClientId, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    onCreateBooking(data, carers);
    form.reset();
    onOpenChange(false);
    toast({
      title: "Booking submitted",
      description: "The booking has been scheduled successfully",
    });
  }

  const addSchedule = () => {
    setScheduleCount(scheduleCount + 1);
    form.setValue("schedules", [
      ...form.getValues().schedules,
      {
        startTime: "09:00",
        endTime: "17:00",
        services: [],
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: false,
        sun: false,
      },
    ]);
  };

  const removeSchedule = (index: number) => {
    const schedules = [...form.getValues().schedules];
    schedules.splice(index, 1);
    form.setValue("schedules", schedules);
    setScheduleCount(scheduleCount - 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Schedule Booking
          </DialogTitle>
          <DialogDescription>
            Schedule a new booking for a client with a carer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Client ID" {...field} />
                    </FormControl>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a carer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {carers.map((carer) => (
                          <SelectItem key={carer.id} value={carer.id}>
                            {carer.name || carer.first_name + " " + carer.last_name}
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
                name="fromDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
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
                            variant={"outline"}
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
            </div>

            <div>
              <FormLabel>Schedules</FormLabel>
              {form.watch("schedules")?.map((schedule, index) => (
                <div key={index} className="border rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Schedule {index + 1}</h4>
                    {form.watch("schedules")?.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSchedule(index)}>
                        <X className="h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.startTime` as const}
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
                      name={`schedules.${index}.endTime` as const}
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
                  <FormField
                    control={form.control}
                    name={`schedules.${index}.services` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Services</FormLabel>
                        <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value[0]}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {services.map((service) => (
                              <SelectItem key={service.id} value={service.id}>
                                {service.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-2">
                    <FormLabel>Days</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.mon` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Mon</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.tue` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Tue</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.wed` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Wed</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.thu` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Thu</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.fri` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Fri</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.sat` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Sat</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.sun` as const}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-1 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Sun</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSchedule} className="gap-1">
                <Plus className="h-4 w-4" />
                Add Schedule
              </Button>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Schedule</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
