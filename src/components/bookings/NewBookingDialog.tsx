
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle, Plus, Sun } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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
  date: z.date({
    required_error: "Booking date is required",
  }),
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
  onCreateBooking: (bookingData: BookingFormValues) => void;
}

const mockServices: Service[] = [
  { id: "svc-001", name: "Personal Care" },
  { id: "svc-002", name: "Medication Management" },
  { id: "svc-003", name: "Mobility Support" },
  { id: "svc-004", name: "Meal Preparation" },
  { id: "svc-005", name: "Companionship" },
  { id: "svc-006", name: "Light Housekeeping" },
  { id: "svc-007", name: "Transport Assistance" },
  { id: "svc-008", name: "Shopping Assistance" },
];

export const NewBookingDialog: React.FC<NewBookingDialogProps> = ({
  open,
  onOpenChange,
  clients,
  carers,
  onCreateBooking,
}) => {
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      carerId: "",
      date: new Date(),
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
      notes: "",
    },
  });

  const handleSubmit = (values: BookingFormValues) => {
    onCreateBooking(values);
    form.reset();
    onOpenChange(false);
    toast.success("Booking created successfully", {
      description: `Booking for ${format(values.date, "dd/MM/yyyy")} has been created`,
    });
  };

  const startTime = form.watch("startTime");
  const allDaysSelected = form.watch("days.all");

  // Handle the "All" days checkbox
  const handleAllDaysChange = (checked: boolean) => {
    if (checked) {
      form.setValue("days", {
        all: true,
        mon: true,
        tue: true,
        wed: true,
        thu: true,
        fri: true,
        sat: true,
        sun: true,
      });
    } else {
      form.setValue("days", {
        all: false,
        mon: false,
        tue: false,
        wed: false,
        thu: false,
        fri: false,
        sat: false,
        sun: false,
      });
    }
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
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
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
                    <FormLabel>Carer</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Select date</span>
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
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!startTime}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions
                          .filter((time) => {
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="services"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Services</FormLabel>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {mockServices.map((service) => (
                      <FormField
                        key={service.id}
                        control={form.control}
                        name="services"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={service.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(service.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, service.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== service.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {service.name}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="days"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-base">Days</FormLabel>
                  </div>
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="days.all"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                handleAllDaysChange(checked === true);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-medium">All Days</FormLabel>
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <FormField
                        control={form.control}
                        name="days.mon"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Monday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.tue"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Tuesday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.wed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Wednesday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.thu"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Thursday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.fri"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Friday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.sat"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Saturday</FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="days.sun"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value || allDaysSelected}
                                onCheckedChange={field.onChange}
                                disabled={allDaysSelected}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Sunday</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              <Button type="submit">Create Booking</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
