import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Check, X } from 'lucide-react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DaySelector } from '@/components/care/forms/DaySelector';
import { TimePickerField } from '@/components/care/forms/TimePickerField';
import { ShiftSelector } from '@/components/care/forms/ShiftSelector';
import { EnhancedDatePicker } from '@/components/ui/enhanced-date-picker';
import { 
  EXISTING_ACTIONS_OPTIONS, 
  ACTION_FREQUENCY_OPTIONS 
} from '@/types/serviceAction';

interface ServiceActionFormProps {
  form: UseFormReturn<any>;
  fieldPrefix: string;
  services?: Array<{ id: string; title: string }>;
  onSave: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  actionNumber: number;
}

export function ServiceActionForm({
  form,
  fieldPrefix,
  services = [],
  onSave,
  onCancel,
  isEditing = false,
  actionNumber,
}: ServiceActionFormProps) {
  const actionType = form.watch(`${fieldPrefix}.action_type`) || 'new';
  const hasInstructions = form.watch(`${fieldPrefix}.has_instructions`) || false;
  const requiredWrittenOutcome = form.watch(`${fieldPrefix}.required_written_outcome`) || false;
  const isServiceSpecific = form.watch(`${fieldPrefix}.is_service_specific`) || false;
  const scheduleType = form.watch(`${fieldPrefix}.schedule_type`) || 'shift';

  const handleExistingActionChange = (actionId: string) => {
    const selectedAction = EXISTING_ACTIONS_OPTIONS.find(a => a.id === actionId);
    if (selectedAction) {
      form.setValue(`${fieldPrefix}.existing_action_id`, actionId);
      form.setValue(`${fieldPrefix}.action_name`, selectedAction.name);
    }
  };

  const handleDaysChange = (days: string[]) => {
    form.setValue(`${fieldPrefix}.selected_days`, days);
  };

  const handleShiftsChange = (shifts: string[]) => {
    form.setValue(`${fieldPrefix}.shift_times`, shifts);
  };

  const handleServiceChange = (serviceId: string) => {
    const selectedService = services.find(s => s.id === serviceId);
    if (selectedService) {
      form.setValue(`${fieldPrefix}.linked_service_id`, serviceId);
      form.setValue(`${fieldPrefix}.linked_service_name`, selectedService.title);
    }
  };

  const ToggleButton = ({ 
    value, 
    selected, 
    onChange, 
    label 
  }: { 
    value: string; 
    selected: boolean; 
    onChange: (val: string) => void;
    label: string;
  }) => (
    <Button
      type="button"
      variant={selected ? 'default' : 'outline'}
      size="sm"
      onClick={() => onChange(value)}
      className="min-w-[80px]"
    >
      {label}
    </Button>
  );

  const YesNoToggle = ({ 
    value, 
    onChange 
  }: { 
    value: boolean; 
    onChange: (val: boolean) => void;
  }) => (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={value ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(true)}
        className="min-w-[60px]"
      >
        Yes
      </Button>
      <Button
        type="button"
        variant={!value ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange(false)}
        className="min-w-[60px]"
      >
        No
      </Button>
    </div>
  );

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isEditing ? `Edit Service Action ${actionNumber}` : `Service Action ${actionNumber}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section 1: Action Type */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
            Action Type
          </h5>
          
          <div className="space-y-3">
            <FormLabel>Type</FormLabel>
            <div className="flex gap-2">
              <ToggleButton
                value="existing"
                selected={actionType === 'existing'}
                onChange={(val) => form.setValue(`${fieldPrefix}.action_type`, val)}
                label="Existing"
              />
              <ToggleButton
                value="new"
                selected={actionType === 'new'}
                onChange={(val) => form.setValue(`${fieldPrefix}.action_type`, val)}
                label="New"
              />
            </div>
          </div>

          {actionType === 'existing' ? (
            <FormField
              control={form.control}
              name={`${fieldPrefix}.existing_action_id`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Existing Action *</FormLabel>
                  <Select onValueChange={handleExistingActionChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an existing action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXISTING_ACTIONS_OPTIONS.map((action) => (
                        <SelectItem key={action.id} value={action.id}>
                          {action.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name={`${fieldPrefix}.action_name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Action Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter new action name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Section 2: Additional Requirements */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
            Additional Requirements
          </h5>

          {/* Add Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Add Instructions?</FormLabel>
              <YesNoToggle
                value={hasInstructions}
                onChange={(val) => form.setValue(`${fieldPrefix}.has_instructions`, val)}
              />
            </div>
            {hasInstructions && (
              <FormField
                control={form.control}
                name={`${fieldPrefix}.instructions`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter instructions for this action..."
                        className="min-h-[80px] resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Required Written Outcome */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Required Written Outcome?</FormLabel>
              <YesNoToggle
                value={requiredWrittenOutcome}
                onChange={(val) => form.setValue(`${fieldPrefix}.required_written_outcome`, val)}
              />
            </div>
            {requiredWrittenOutcome && (
              <FormField
                control={form.control}
                name={`${fieldPrefix}.written_outcome`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Define required outcome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Service Specific */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Is this action service-specific?</FormLabel>
              <YesNoToggle
                value={isServiceSpecific}
                onChange={(val) => form.setValue(`${fieldPrefix}.is_service_specific`, val)}
              />
            </div>
            {isServiceSpecific && services.length > 0 && (
              <FormField
                control={form.control}
                name={`${fieldPrefix}.linked_service_id`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Service</FormLabel>
                    <Select onValueChange={handleServiceChange} value={field.value}>
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
            )}
          </div>
        </div>

        {/* Section 3: Schedule */}
        <div className="space-y-4">
          <h5 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
            Schedule
          </h5>

          {/* Start & End Date */}
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
                            return date < new Date(startDate);
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

          {/* Schedule Type Toggle */}
          <div className="space-y-3">
            <FormLabel>Type</FormLabel>
            <div className="flex gap-2">
              <ToggleButton
                value="shift"
                selected={scheduleType === 'shift'}
                onChange={(val) => form.setValue(`${fieldPrefix}.schedule_type`, val)}
                label="Shift"
              />
              <ToggleButton
                value="time_specific"
                selected={scheduleType === 'time_specific'}
                onChange={(val) => form.setValue(`${fieldPrefix}.schedule_type`, val)}
                label="Time Specific"
              />
            </div>
          </div>

          {/* Shift or Time Selection */}
          {scheduleType === 'shift' ? (
            <div className="space-y-2">
              <FormLabel>Shift Times</FormLabel>
              <ShiftSelector
                selectedShifts={form.watch(`${fieldPrefix}.shift_times`) || []}
                onChange={handleShiftsChange}
              />
            </div>
          ) : (
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
          )}

          {/* Days of the Week */}
          <div className="space-y-2">
            <FormLabel>Days of the Week</FormLabel>
            <DaySelector
              selectedDays={form.watch(`${fieldPrefix}.selected_days`) || []}
              onChange={handleDaysChange}
            />
          </div>

          {/* Frequency */}
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
                    {ACTION_FREQUENCY_OPTIONS.map((option) => (
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

          {/* Notes */}
          <FormField
            control={form.control}
            name={`${fieldPrefix}.notes`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Optional notes about this service action..."
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
            Save Service Action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
