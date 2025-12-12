
import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Plus, X, Calendar } from "lucide-react";
import { format } from "date-fns";
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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useServices } from "@/data/hooks/useServices";
import { useClientAccountingSettings } from "@/hooks/useClientAccounting";
import { useTenant } from "@/contexts/TenantContext";
import { DaySelector } from "@/components/care/forms/DaySelector";
import { TimePickerField } from "@/components/care/forms/TimePickerField";
import { getDefaultServicePlan, FREQUENCY_OPTIONS } from "@/types/servicePlan";

interface WizardStep11ServicePlansProps {
  form: UseFormReturn<any>;
  clientId?: string;
}

export function WizardStep11ServicePlans({ form, clientId }: WizardStep11ServicePlansProps) {
  const { organization } = useTenant();
  const { data: services = [] } = useServices(organization?.id);
  const { data: accountingSettings } = useClientAccountingSettings(clientId || '');

  const addServicePlan = () => {
    const current = form.getValues("service_plans") || [];
    const newPlan = getDefaultServicePlan(
      accountingSettings?.authority_category || '',
      accountingSettings?.authority_category || ''
    );
    form.setValue("service_plans", [...current, newPlan]);
  };

  const removeServicePlan = (index: number) => {
    const current = form.getValues("service_plans") || [];
    form.setValue("service_plans", current.filter((_: any, i: number) => i !== index));
  };

  const servicePlans = form.watch("service_plans") || [];

  const handleServiceChange = (index: number, serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      form.setValue(`service_plans.${index}.service_id`, serviceId);
      form.setValue(`service_plans.${index}.service_name`, selectedService.title);
    }
  };

  const handleDaysChange = (index: number, days: string[]) => {
    form.setValue(`service_plans.${index}.selected_days`, days);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Service Plans</h2>
        <p className="text-muted-foreground">
          Overall care coordination and service planning for comprehensive care delivery.
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Service Plans</h3>
            <Button type="button" onClick={addServicePlan} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Service Plan
            </Button>
          </div>

          {servicePlans.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <p>No service plans added yet. Click "Add Service Plan" to create your first plan.</p>
            </div>
          )}

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
            {servicePlans.map((_: any, index: number) => (
              <Card key={index} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Service Plan {index + 1}</CardTitle>
                    <Button
                      type="button"
                      onClick={() => removeServicePlan(index)}
                      size="sm"
                      variant="outline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Section 1: General */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      General
                    </h5>
                    
                    <FormField
                      control={form.control}
                      name={`service_plans.${index}.caption`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Caption *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter service plan caption" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`service_plans.${index}.start_date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date *</FormLabel>
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
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
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
                        name={`service_plans.${index}.end_date`}
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date *</FormLabel>
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
                                      format(new Date(field.value), "PPP")
                                    ) : (
                                      <span>Pick date</span>
                                    )}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value ? new Date(field.value) : undefined}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Section 2: Service Details */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Service Details
                    </h5>

                    {/* Days Selection */}
                    <div className="space-y-2">
                      <FormLabel>Days Selection</FormLabel>
                      <DaySelector
                        selectedDays={form.watch(`service_plans.${index}.selected_days`) || []}
                        onChange={(days) => handleDaysChange(index, days)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Service Name Dropdown */}
                      <FormField
                        control={form.control}
                        name={`service_plans.${index}.service_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Name *</FormLabel>
                            <Select 
                              onValueChange={(value) => handleServiceChange(index, value)} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select service" />
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

                      {/* Authority (auto-populated) */}
                      <div className="space-y-2">
                        <FormLabel>Authority</FormLabel>
                        <div className="flex items-center gap-2 min-h-[40px] px-3 py-2 border border-input rounded-md bg-muted/50">
                          {accountingSettings?.authority_category ? (
                            <Badge variant="secondary" className="capitalize">
                              {accountingSettings.authority_category}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              No authority set in client settings
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <TimePickerField
                        label="Start Time"
                        required
                        value={form.watch(`service_plans.${index}.start_time`) || ''}
                        onChange={(value) => form.setValue(`service_plans.${index}.start_time`, value)}
                      />

                      <TimePickerField
                        label="End Time"
                        required
                        value={form.watch(`service_plans.${index}.end_time`) || ''}
                        onChange={(value) => form.setValue(`service_plans.${index}.end_time`, value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`service_plans.${index}.frequency`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frequency</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select frequency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {FREQUENCY_OPTIONS.map((option) => (
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

                      <FormField
                        control={form.control}
                        name={`service_plans.${index}.location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter location" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`service_plans.${index}.note`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Note</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this service plan..."
                              className="min-h-[80px] resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Form>
    </div>
  );
}
