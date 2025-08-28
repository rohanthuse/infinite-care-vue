import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Plus, X, ChevronDown } from "lucide-react";

import { useBranchStaffAndClients } from "@/hooks/useBranchStaffAndClients";

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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { BankHolidayNotification } from "@/components/scheduling/BankHolidayNotification";

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
  carerIds: z.array(z.string()).min(1, { message: "At least one carer required" }),
  fromDate: z.date({
    required_error: "A date is required.",
  }),
  untilDate: z.date({
    required_error: "A date is required.",
  }),
  schedules: z.array(scheduleSchema).min(1, { message: "At least one schedule is required" }),
  notes: z.string().optional(),
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
    endTime?: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Fetch clients and staff data
  const { clients, isLoading: isLoadingClients } = useBranchStaffAndClients(branchId || "");

  // Filter carers based on search query
  const filteredCarers = useMemo(() => {
    if (!searchQuery.trim()) return carers;
    const query = searchQuery.toLowerCase();
    return carers.filter(carer => {
      const carerName = (carer.name || `${carer.first_name} ${carer.last_name}`).toLowerCase();
      return carerName.includes(query);
    });
  }, [carers, searchQuery]);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!clientSearchQuery.trim()) return clients;
    const query = clientSearchQuery.toLowerCase();
    return clients.filter(client => {
      const clientName = `${client.first_name} ${client.last_name}`.toLowerCase();
      const clientEmail = (client.email || "").toLowerCase();
      return clientName.includes(query) || clientEmail.includes(query);
    });
  }, [clients, clientSearchQuery]);

  // Helper function to get default days based on prefilled date
  const getDefaultDaysForDate = (date?: Date) => {
    if (!date) {
      // Default: weekdays only
      return { mon: true, tue: true, wed: true, thu: true, fri: true, sat: false, sun: false };
    }
    
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayMap = {
      0: { sun: true }, // Sunday
      1: { mon: true }, // Monday  
      2: { tue: true }, // Tuesday
      3: { wed: true }, // Wednesday
      4: { thu: true }, // Thursday
      5: { fri: true }, // Friday
      6: { sat: true }, // Saturday
    };
    
    // Set all days to false, then enable the specific day
    const defaultDays = { mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false };
    return { ...defaultDays, ...dayMap[dayOfWeek] };
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: "",
      carerIds: prefilledData?.carerId ? [prefilledData.carerId] : [],
      fromDate: prefilledData?.date || new Date(),
      untilDate: prefilledData?.date || new Date(),
      notes: "",
      schedules: [
        {
          startTime: prefilledData?.startTime || "09:00",
          endTime: prefilledData?.endTime || 
            (prefilledData?.startTime ? 
              `${String(Math.floor((parseInt(prefilledData.startTime.split(':')[0]) + 1) % 24)).padStart(2, '0')}:${prefilledData.startTime.split(':')[1]}` 
              : "10:00"),
          services: [],
          ...getDefaultDaysForDate(prefilledData?.date),
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
    // Create bookings for each selected carer
    const bookingsToCreate = data.carerIds.map(carerId => ({
      ...data,
      carerId, // Convert back to single carerId for each booking
    }));
    
    // Create bookings sequentially for each carer
    bookingsToCreate.forEach(bookingData => {
      onCreateBooking(bookingData, carers);
    });
    
    form.reset();
    onOpenChange(false);
    toast("Bookings submitted", {
      description: `Created bookings for ${data.carerIds.length} carer(s)`,
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
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Clock className="h-5 w-5" />
            Schedule Booking
          </DialogTitle>
          <DialogDescription>
            Schedule a new booking for a client with a carer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value 
                              ? (() => {
                                  const selectedClient = clients.find(c => c.id === field.value);
                                  return selectedClient 
                                    ? `${selectedClient.first_name} ${selectedClient.last_name}`
                                    : "Unknown Client";
                                })()
                              : "Select client..."
                            }
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[320px] p-0" align="start" sideOffset={4}>
                          <div className="p-3 border-b">
                            <Input
                              placeholder="Search clients..."
                              value={clientSearchQuery}
                              onChange={(e) => setClientSearchQuery(e.target.value)}
                              className="h-8"
                            />
                          </div>
                          <div className="max-h-60 overflow-y-auto">
                            {isLoadingClients ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Loading clients...
                              </div>
                            ) : filteredClients.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No clients found
                              </div>
                            ) : (
                              <div className="p-1">
                                {filteredClients.map((client) => (
                                  <div
                                    key={client.id}
                                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                    onClick={() => {
                                      field.onChange(client.id);
                                      setClientSearchQuery("");
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">
                                        {client.first_name} {client.last_name}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {client.id.slice(0, 8)}... • {client.email}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carerIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carers</FormLabel>
                      <div className="space-y-3">
                        {/* Dropdown trigger */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value?.length && "text-muted-foreground"
                              )}
                            >
                              {field.value?.length 
                                ? `${field.value.length} carer${field.value.length !== 1 ? 's' : ''} selected`
                                : "Select carers..."
                              }
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[320px] p-0" align="start" sideOffset={4}>
                            <div className="p-3 border-b">
                              <Input
                                placeholder="Search carers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-8"
                              />
                            </div>
                            <div className="p-2">
                              <div className="flex items-center justify-between mb-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const allCarerIds = filteredCarers.map(c => c.id);
                                    field.onChange(allCarerIds);
                                  }}
                                  className="h-6 px-2 text-xs"
                                >
                                  Select All
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => field.onChange([])}
                                  className="h-6 px-2 text-xs"
                                >
                                  Clear All
                                </Button>
                              </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCarers.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                  No carers found
                                </div>
                              ) : (
                                <div className="p-1">
                                  {filteredCarers.map((carer) => {
                                    const isSelected = field.value?.includes(carer.id);
                                    const carerName = carer.name || `${carer.first_name} ${carer.last_name}`;
                                    
                                    return (
                                      <div
                                        key={carer.id}
                                        className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                        onClick={() => {
                                          const currentValue = field.value || [];
                                          if (isSelected) {
                                            field.onChange(currentValue.filter((id: string) => id !== carer.id));
                                          } else {
                                            field.onChange([...currentValue, carer.id]);
                                          }
                                        }}
                                      >
                                        <Checkbox
                                          checked={isSelected}
                                          className="pointer-events-none"
                                        />
                                        <span className="flex-1">{carerName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Selected carers display */}
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {field.value.map((carerId) => {
                              const carer = carers.find(c => c.id === carerId);
                              const carerName = carer?.name || `${carer?.first_name} ${carer?.last_name}` || 'Unknown';
                              
                              return (
                                <Badge
                                  key={carerId}
                                  variant="secondary"
                                  className="text-xs px-2 py-1"
                                >
                                  {carerName}
                                  <X 
                                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                                    onClick={() => {
                                      const currentValue = field.value || [];
                                      field.onChange(currentValue.filter((id: string) => id !== carerId));
                                    }}
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Bank Holiday Notifications */}
              {form.watch("fromDate") && (
                <BankHolidayNotification 
                  date={form.watch("fromDate")} 
                  variant="info"
                  className="mb-4"
                />
              )}
              {form.watch("untilDate") && form.watch("untilDate") !== form.watch("fromDate") && (
                <BankHolidayNotification 
                  date={form.watch("untilDate")} 
                  variant="info"
                  className="mb-4"
                />
              )}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                          <Select onValueChange={(value) => field.onChange([value])} defaultValue={field.value?.[0]}>
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
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
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
                <Button type="button" onClick={addSchedule} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Schedule
                </Button>
              </div>

              {/* Additional Information Field */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Information</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any additional information or special requirements..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter className="flex-shrink-0 mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Create Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}