import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

const timeOptions = [
  "07:00", "07:30", "08:00", "08:30", "09:00", "09:30", 
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", 
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30",
  "19:00", "19:30", "20:00", "20:30", "21:00", "21:30"
];

const formSchema = z.object({
  clientId: z.string().min(1, { message: "Client is required" }),
  carerId: z.string().min(1, { message: "Carer is required" }),
  fromDate: z.date({
    required_error: "From date is required",
  }),
  untilDate: z.date({
    required_error: "Until date is required",
  }),
  schedules: z.array(z.object({
    startTime: z.string().min(1, { message: "Start time is required" }),
    endTime: z.string().min(1, { message: "End time is required" }),
    services: z.array(z.string()).min(1, { message: "At least one service is required" }),
    days: z.object({
      all: z.boolean().optional(),
      mon: z.boolean().optional(),
      tue: z.boolean().optional(),
      wed: z.boolean().optional(),
      thu: z.boolean().optional(),
      fri: z.boolean().optional(),
      sat: z.boolean().optional(),
      sun: z.boolean().optional(),
    }),
  })).min(1),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof formSchema>;

interface Client {
  id: string;
  name: string;
}

interface Carer {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
}

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  carers: Carer[];
  services?: Service[];
  onCreateBooking: (bookingData: BookingFormValues) => void;
  initialData?: {
    date?: Date;
    startTime?: string;
    clientId?: string;
    carerId?: string;
  } | null;
}

export const NewBookingDialog = ({
  open,
  onOpenChange,
  clients,
  carers,
  services = [],
  onCreateBooking,
  initialData,
  isLoading,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  carers: any[];
  services?: Service[]; // <-- NEW PROP
  onCreateBooking: (data: any) => void;
  initialData?: any;
  isLoading?: boolean;
  error?: any;
}) => {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      carerId: "",
      fromDate: new Date(),
      untilDate: new Date(),
      schedules: [
        {
          startTime: "",
          endTime: "",
          services: [],
          days: {
            all: false,
            mon: false,
            tue: false,
            wed: false,
            thu: false,
            fri: false,
            sat: false,
            sun: false,
          },
        },
      ],
      notes: "",
    },
  });

  useEffect(() => {
    if (open && initialData) {
      if (initialData.date) {
        form.setValue("fromDate", initialData.date);
        form.setValue("untilDate", initialData.date);
      }
      
      if (initialData.startTime) {
        const [startHour, startMin] = initialData.startTime.split(':').map(Number);
        let endHour = startHour + 1;
        const endMin = startMin;

        if (endHour >= 24) {
          endHour = 23;
        }

        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
        
        form.setValue("schedules.0.startTime", initialData.startTime);
        form.setValue("schedules.0.endTime", endTime);
      }
      
      if (initialData.clientId) {
        form.setValue("clientId", initialData.clientId);
      }
      
      if (initialData.carerId) {
        form.setValue("carerId", initialData.carerId);
      }
      
      if (initialData.date) {
        const dayOfWeek = initialData.date.getDay();
        const dayMapping: Record<number, keyof BookingFormValues["schedules"][0]["days"]> = {
          0: "sun",
          1: "mon",
          2: "tue",
          3: "wed",
          4: "thu",
          5: "fri",
          6: "sat"
        };
        
        const dayKey = dayMapping[dayOfWeek];
        if (dayKey) {
          const updatedSchedules = [...form.getValues().schedules];
          updatedSchedules[0] = {
            ...updatedSchedules[0],
            days: {
              ...updatedSchedules[0].days,
              [dayKey]: true
            }
          };
          form.setValue("schedules", updatedSchedules);
        }
      }
    }
  }, [open, initialData, form]);

  const handleSubmit = (values: BookingFormValues) => {
    onCreateBooking(values);
    form.reset();
    onOpenChange(false);
    toast.success("Booking created successfully", {
      description: `Booking from ${format(values.fromDate, "dd/MM/yyyy")} to ${format(values.untilDate, "dd/MM/yyyy")} has been created`,
    });
  };

  const handleAllDaysChange = (checked: boolean, index: number) => {
    const schedules = [...form.getValues("schedules")];
    
    if (checked) {
      schedules[index].days = {
        all: true,
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true,
      };
    } else {
      schedules[index].days = {
        all: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        sun: false,
      };
    }
    
    form.setValue("schedules", schedules);
  };

  const addSchedule = () => {
    const schedules = [...form.getValues("schedules")];
    schedules.push({
      startTime: "",
      endTime: "",
      services: [],
      days: {
        all: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        sun: false,
      },
    });
    form.setValue("schedules", schedules);
  };

  const removeSchedule = (index: number) => {
    const schedules = [...form.getValues("schedules")];
    schedules.splice(index, 1);
    form.setValue("schedules", schedules);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Create New Booking</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new booking
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">Client</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
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
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">Carer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select carer" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fromDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">From</FormLabel>
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
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Select start date</span>
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
                          className={cn("p-3 pointer-events-auto")}
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
                  <FormItem>
                    <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">Until</FormLabel>
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
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Select end date</span>
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
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <h3 className="text-lg font-medium">Schedule</h3>
                <Separator className="flex-1 mx-4" />
              </div>

              {form.watch("schedules").map((schedule, index) => (
                <div key={index} className="border rounded-md p-4 bg-gray-50 relative">
                  {index > 0 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-2 top-2"
                      onClick={() => removeSchedule(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.startTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">From</FormLabel>
                          <div className="flex items-center">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeOptions.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Clock className="ml-2 h-4 w-4 opacity-50" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`schedules.${index}.endTime`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">Until</FormLabel>
                          <div className="flex items-center">
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeOptions
                                  .filter((time) => {
                                    const startTime = form.getValues(`schedules.${index}.startTime`);
                                    if (!startTime) return true;
                                    return time > startTime;
                                  })
                                  .map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Clock className="ml-2 h-4 w-4 opacity-50" />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 mb-4">
                    <FormField
                      control={form.control}
                      name={`schedules.${index}.services`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:ml-0.5 after:text-primary">Services</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              const currentServices = field.value || [];
                              if (!currentServices.includes(value)) {
                                field.onChange([...currentServices, value]);
                              }
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select services" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="mt-2">
                            {field.value && field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {field.value.map((serviceId) => {
                                  const service = services.find(s => s.id === serviceId);
                                  return service ? (
                                    <div key={serviceId} className="flex items-center bg-primary/10 px-2.5 py-1 rounded-full text-xs">
                                      {service.name}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 ml-1 p-0"
                                        onClick={() => {
                                          field.onChange(field.value?.filter((id: string) => id !== serviceId));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No services selected</p>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`schedules.${index}.days`}
                    render={() => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel>What Days:</FormLabel>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 items-center">
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.all`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={(checked) => {
                                      field.onChange(checked);
                                      handleAllDaysChange(checked === true, index);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">All</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.mon`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Mon</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.tue`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Tue</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.wed`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Wed</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.thu`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Thu</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.fri`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Fri</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.sat`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Sat</FormLabel>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.days.sun`}
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value || form.getValues(`schedules.${index}.days.all`)}
                                    onCheckedChange={field.onChange}
                                    disabled={form.getValues(`schedules.${index}.days.all`)}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm cursor-pointer">Sun</FormLabel>
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}

              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-2" 
                onClick={addSchedule}
              >
                <Plus className="mr-1 h-4 w-4" /> Add New Time
              </Button>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes here"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Saving..." : "Create Booking"}
              </Button>
              {error && (
                <div className="text-red-600 mt-1 text-sm">
                  {error.message || "An error occurred while creating booking."}
                </div>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
