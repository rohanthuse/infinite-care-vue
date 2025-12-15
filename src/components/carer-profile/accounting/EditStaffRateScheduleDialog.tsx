import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateStaffRateSchedule, StaffRateSchedule } from "@/hooks/useStaffAccounting";
import { createDateValidation, createTimeValidation } from "@/utils/validationUtils";
import { rateCategoryLabels, payBasedOnLabels, dayLabels } from "@/types/clientAccounting";

const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'bank_holiday'];

const formSchema = z.object({
  start_date: createDateValidation('Start date'),
  end_date: z.string().transform(val => val === '' ? undefined : val).optional(),
  days_covered: z.array(z.string()).min(1, 'At least one day must be selected'),
  time_from: createTimeValidation('Time from'),
  time_until: createTimeValidation('Time until'),
  rate_category: z.enum(['standard', 'adult', 'cyp']).default('standard'),
  pay_based_on: z.enum(['service', 'hours_minutes', 'daily_flat_rate']).default('service'),
  charge_type: z.enum(['flat_rate', 'pro_rata', 'hourly_rate', 'hour_minutes', 'rate_per_hour', 'rate_per_minutes_pro_rata', 'rate_per_minutes_flat_rate', 'daily_flat_rate']).optional().default('hourly_rate'),
  base_rate: z.number().min(0.01, 'Rate is required and must be greater than 0'),
  bank_holiday_multiplier: z.number().min(1).max(3).optional(),
  is_vatable: z.boolean(),
}).refine(data => {
  if (data.time_from && data.time_until) {
    const start = new Date(`2000-01-01T${data.time_from}`);
    const end = new Date(`2000-01-01T${data.time_until}`);
    return start < end;
  }
  return true;
}, {
  message: "Time until must be after time from",
  path: ["time_until"]
});

type FormData = z.infer<typeof formSchema>;

interface EditStaffRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: StaffRateSchedule;
  staffId: string;
  branchId: string;
}

export const EditStaffRateScheduleDialog: React.FC<EditStaffRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule,
  staffId,
  branchId,
}) => {
  const { organization } = useTenant();
  const updateSchedule = useUpdateStaffRateSchedule();
  const [enableBankHolidayMultiplier, setEnableBankHolidayMultiplier] = useState(
    schedule.bank_holiday_multiplier > 1
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      start_date: schedule.start_date,
      end_date: schedule.end_date || '',
      days_covered: schedule.days_covered,
      time_from: schedule.time_from,
      time_until: schedule.time_until,
      rate_category: (schedule.rate_category as 'standard' | 'adult' | 'cyp') || 'standard',
      pay_based_on: (schedule.pay_based_on as 'service' | 'hours_minutes' | 'daily_flat_rate') || 'service',
      charge_type: (schedule.charge_type as any) || 'hourly_rate',
      base_rate: schedule.base_rate,
      bank_holiday_multiplier: schedule.bank_holiday_multiplier,
      is_vatable: schedule.is_vatable,
    },
  });

  const selectedDays = form.watch('days_covered');
  const allDaysSelected = ALL_DAYS.every(day => selectedDays?.includes(day));

  const toggleAllDays = (checked: boolean) => {
    if (checked) {
      form.setValue('days_covered', ALL_DAYS);
    } else {
      form.setValue('days_covered', []);
    }
  };

  const selectedPayBasedOn = form.watch("pay_based_on");

  // Reset form when schedule changes
  useEffect(() => {
    if (schedule) {
      form.reset({
        start_date: schedule.start_date,
        end_date: schedule.end_date || '',
        days_covered: schedule.days_covered,
        time_from: schedule.time_from,
        time_until: schedule.time_until,
        rate_category: (schedule.rate_category as 'standard' | 'adult' | 'cyp') || 'standard',
        pay_based_on: (schedule.pay_based_on as 'service' | 'hours_minutes' | 'daily_flat_rate') || 'service',
        charge_type: (schedule.charge_type as any) || 'hourly_rate',
        base_rate: schedule.base_rate,
        bank_holiday_multiplier: schedule.bank_holiday_multiplier,
        is_vatable: schedule.is_vatable,
      });
      setEnableBankHolidayMultiplier(schedule.bank_holiday_multiplier > 1);
    }
  }, [schedule, form]);

  // Auto-set charge_type based on pay_based_on
  useEffect(() => {
    const currentPayBasedOn = form.getValues('pay_based_on');
    
    if (currentPayBasedOn === 'hours_minutes') {
      form.setValue('charge_type', 'rate_per_hour');
    } else if (currentPayBasedOn === 'service') {
      form.setValue('charge_type', 'hourly_rate');
    } else if (currentPayBasedOn === 'daily_flat_rate') {
      form.setValue('charge_type', 'daily_flat_rate');
    }
  }, [selectedPayBasedOn, form]);

  const onSubmit = (data: FormData) => {
    const scheduleData = {
      id: schedule.id,
      staff_id: staffId,
      branch_id: branchId,
      organization_id: organization?.id || '',
      service_type_codes: [], // Default empty - not used for staff
      authority_type: '', // Default empty - not used for staff
      start_date: data.start_date,
      end_date: data.end_date || null,
      days_covered: data.days_covered,
      time_from: data.time_from,
      time_until: data.time_until,
      rate_category: data.rate_category,
      pay_based_on: data.pay_based_on,
      charge_type: data.pay_based_on === 'hours_minutes' ? 'rate_per_hour' : data.charge_type,
      base_rate: data.base_rate || 0,
      rate_15_minutes: null,
      rate_30_minutes: null,
      rate_45_minutes: null,
      rate_60_minutes: null,
      consecutive_hours_rate: null,
      bank_holiday_multiplier: enableBankHolidayMultiplier ? (data.bank_holiday_multiplier || 1) : 1,
      is_vatable: data.is_vatable,
    };

    updateSchedule.mutate(scheduleData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  const toggleDay = (day: string, checked: boolean) => {
    const currentDays = form.getValues('days_covered');
    if (checked) {
      form.setValue('days_covered', [...currentDays, day]);
    } else {
      form.setValue('days_covered', currentDays.filter(d => d !== day));
    }
  };

  const getRateLabel = () => {
    if (selectedPayBasedOn === 'hours_minutes') {
      return 'Rate Per Hour (£) *';
    }
    return 'Base Rate (£) *';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Rate Schedule</DialogTitle>
          <DialogDescription>
            Update rate schedule details for this staff member
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information - Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="start_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="end_date" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <Separator />

            {/* Days & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Days & Time</h3>
              
              <FormField control={form.control} name="days_covered" render={() => (
                <FormItem>
                  <FormLabel>Days Covered *</FormLabel>
                  
                  {/* Select All Days Checkbox */}
                  <div className="flex items-center space-x-2 mb-3 pb-2 border-b">
                    <Checkbox
                      id="edit-select-all-days"
                      checked={allDaysSelected}
                      onCheckedChange={(checked) => toggleAllDays(checked as boolean)}
                    />
                    <Label htmlFor="edit-select-all-days" className="text-sm font-medium cursor-pointer">
                      Select All Days
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                    {Object.entries(dayLabels).map(([key, label]) => (
                      <FormField
                        key={key}
                        control={form.control}
                        name="days_covered"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(key)}
                                onCheckedChange={checked => toggleDay(key, checked as boolean)}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {key === 'bank_holiday' ? 'Bank Hol' : label.slice(0, 3)}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="time_from" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time From *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="time_until" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Until *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            <Separator />

            {/* Rate Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rate Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="rate_category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rate category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(rateCategoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="pay_based_on" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Based On *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select pay basis" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(payBasedOnLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Rate Field - Always visible with dynamic label */}
              <FormField control={form.control} name="base_rate" render={({ field }) => (
                <FormItem>
                  <FormLabel>{getRateLabel()}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className="max-w-xs"
                      {...field}
                      onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Bank Holiday Multiplier Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Enable Bank Holiday Multiplier</Label>
                    <p className="text-sm text-muted-foreground">
                      Apply a multiplier rate for bank holidays
                    </p>
                  </div>
                  <Switch 
                    checked={enableBankHolidayMultiplier}
                    onCheckedChange={(checked) => {
                      setEnableBankHolidayMultiplier(checked);
                      if (!checked) {
                        form.setValue('bank_holiday_multiplier', 1);
                      }
                    }}
                  />
                </div>
                
                {enableBankHolidayMultiplier && (
                  <FormField control={form.control} name="bank_holiday_multiplier" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Holiday Multiplier</FormLabel>
                      <Select onValueChange={value => field.onChange(parseFloat(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger className="max-w-xs">
                            <SelectValue placeholder="Select multiplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1x (Normal Rate)</SelectItem>
                          <SelectItem value="1.5">1.5x (Time and Half)</SelectItem>
                          <SelectItem value="2">2x (Double Time)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>
            </div>

            <Separator />

            {/* VAT Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">VAT Configuration</h3>
              
              <FormField control={form.control} name="is_vatable" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Is this rate VATable? *
                    </FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Select whether VAT should be applied to this rate schedule
                    </div>
                  </div>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Button type="button" variant={field.value === false ? "default" : "outline"} size="sm" onClick={() => field.onChange(false)}>
                        No
                      </Button>
                      <Button type="button" variant={field.value === true ? "default" : "outline"} size="sm" onClick={() => field.onChange(true)}>
                        Yes
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSchedule.isPending}>
                {updateSchedule.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
