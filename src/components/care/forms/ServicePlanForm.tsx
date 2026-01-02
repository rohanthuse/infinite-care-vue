import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Check, X, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DaySelector } from "@/components/care/forms/DaySelector";
import { TimePickerField } from "@/components/care/forms/TimePickerField";
import { FREQUENCY_OPTIONS, ServicePlanData } from "@/types/servicePlan";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface ServicePlanFormProps {
  form: UseFormReturn<any>;
  fieldPrefix: string;
  services: Array<{ id: string; title: string }>;
  authorityCategory?: string | null;
  onSave: () => void;
  onSaveAndAddAnother?: () => void;
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
  onSaveAndAddAnother,
  onCancel,
  isEditing = false,
  planNumber,
}: ServicePlanFormProps) {
  // Create service options for MultiSelect
  const serviceOptions: MultiSelectOption[] = services.map(s => ({
    value: s.id,
    label: s.title
  }));

  const handleServicesChange = (selectedIds: string[]) => {
    const selectedServices = services.filter(s => selectedIds.includes(s.id));
    form.setValue(`${fieldPrefix}.service_ids`, selectedIds);
    form.setValue(`${fieldPrefix}.service_names`, selectedServices.map(s => s.title));
    // Keep backward compatibility - store first selected service in single fields
    if (selectedIds.length > 0) {
      form.setValue(`${fieldPrefix}.service_id`, selectedIds[0]);
      form.setValue(`${fieldPrefix}.service_name`, selectedServices[0]?.title || '');
    } else {
      form.setValue(`${fieldPrefix}.service_id`, '');
      form.setValue(`${fieldPrefix}.service_name`, '');
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
                  <FormControl>
                    <EnhancedDatePicker
                      value={field.value ? new Date(field.value) : undefined}
                      onChange={(date) => field.onChange(date)}
                      placeholder="DD/MM/YYYY"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`${fieldPrefix}.end_date`}
              render={({ field }) => {
                const startDate = form.watch(`${fieldPrefix}.start_date`);
                return (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date *</FormLabel>
                    <FormControl>
                      <EnhancedDatePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) => field.onChange(date)}
                        placeholder="DD/MM/YYYY"
                        disabled={(date) => {
                          if (startDate) {
                            const start = new Date(startDate);
                            start.setHours(0, 0, 0, 0);
                            return date < start;
                          }
                          return false;
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
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
            {/* Service Name MultiSelect */}
            <div className="space-y-2">
              <FormLabel>Service Name(s) *</FormLabel>
              <MultiSelect
                options={serviceOptions}
                selected={form.watch(`${fieldPrefix}.service_ids`) || []}
                onSelectionChange={handleServicesChange}
                placeholder="Select services"
              />
            </div>

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
          {onSaveAndAddAnother && !isEditing && (
            <Button type="button" variant="secondary" onClick={onSaveAndAddAnother}>
              <Plus className="h-4 w-4 mr-1" />
              Save & Add Another
            </Button>
          )}
          <Button type="button" onClick={onSave}>
            <Check className="h-4 w-4 mr-1" />
            Save Service Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
