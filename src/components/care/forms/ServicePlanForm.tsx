import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Calendar, Check, X } from "lucide-react";
import { format } from "date-fns";
import {
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
import { DaySelector } from "@/components/care/forms/DaySelector";
import { TimePickerField } from "@/components/care/forms/TimePickerField";
import { FREQUENCY_OPTIONS, ServicePlanData } from "@/types/servicePlan";

interface ServicePlanFormProps {
  form: UseFormReturn<any>;
  fieldPrefix: string;
  services: Array<{ id: string; title: string }>;
  authorityCategory?: string | null;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  planNumber: number;
}

export function ServicePlanForm({
  form,
  fieldPrefix,
  services,
  authorityCategory,
  onSave,
  onCancel,
  isEditing = false,
  planNumber,
}: ServicePlanFormProps) {
  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      form.setValue(`${fieldPrefix}.service_id`, serviceId);
      form.setValue(`${fieldPrefix}.service_name`, selectedService.title);
    }
  };

  const handleDaysChange = (days: string[]) => {
    form.setValue(`${fieldPrefix}.selected_days`, days);
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {isEditing ? `Edit Service Plan ${planNumber}` : `Service Plan ${planNumber}`}
          </CardTitle>
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
            name={`${fieldPrefix}.caption`}
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
              name={`${fieldPrefix}.start_date`}
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
              name={`${fieldPrefix}.end_date`}
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
              selectedDays={form.watch(`${fieldPrefix}.selected_days`) || []}
              onChange={handleDaysChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Service Name Dropdown */}
            <FormField
              control={form.control}
              name={`${fieldPrefix}.service_id`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Name *</FormLabel>
                  <Select 
                    onValueChange={handleServiceChange} 
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
                {authorityCategory ? (
                  <Badge variant="secondary" className="capitalize">
                    {authorityCategory}
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
              value={form.watch(`${fieldPrefix}.start_time`) || ''}
              onChange={(value) => form.setValue(`${fieldPrefix}.start_time`, value)}
            />

            <TimePickerField
              label="End Time"
              required
              value={form.watch(`${fieldPrefix}.end_time`) || ''}
              onChange={(value) => form.setValue(`${fieldPrefix}.end_time`, value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name={`${fieldPrefix}.frequency`}
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
              name={`${fieldPrefix}.location`}
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
            name={`${fieldPrefix}.note`}
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

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button type="button" onClick={onSave}>
            <Check className="h-4 w-4 mr-1" />
            Save Service Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
