import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { createDateValidation, createTimeValidation } from '@/utils/validationUtils';
import { useUpdateClientRateSchedule } from '@/hooks/useClientAccounting';
import { 
  ClientRateSchedule,
  rateCategoryLabels,
  payBasedOnLabels,
  chargeTypeLabels,
  dayLabels
} from '@/types/clientAccounting';

const editRateScheduleSchema = z.object({
  authority_type: z.string().min(1, 'Authority type is required'),
  service_type_codes: z.array(z.string()).default([]),
  start_date: createDateValidation('Start date'),
  end_date: z.string().optional(),
  days_covered: z.array(z.string()).min(1, 'At least one day must be selected'),
  time_from: createTimeValidation('Time from'),
  time_until: createTimeValidation('Time until'),
  rate_category: z.enum(['standard', 'adult', 'cyp']).default('standard'),
  pay_based_on: z.enum(['service', 'hours_minutes', 'daily_flat_rate']).default('service'),
  charge_type: z.enum([
    'flat_rate', 'pro_rata', 'hourly_rate', 'hour_minutes', 
    'rate_per_hour', 'rate_per_minutes_pro_rata', 
    'rate_per_minutes_flat_rate', 'daily_flat_rate'
  ]).default('hourly_rate'),
  base_rate: z.number().min(0.01, 'Base rate must be greater than 0'),
  rate_15_minutes: z.number().optional(),
  rate_30_minutes: z.number().optional(),
  rate_45_minutes: z.number().optional(),
  rate_60_minutes: z.number().optional(),
  consecutive_hours_rate: z.number().optional(),
  bank_holiday_multiplier: z.number().min(1).max(3).default(1)
});

type EditRateScheduleFormData = z.infer<typeof editRateScheduleSchema>;

interface EditRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: ClientRateSchedule;
  clientId: string;
  branchId: string;
}

export const EditRateScheduleDialog: React.FC<EditRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule,
  clientId,
  branchId
}) => {
  const updateSchedule = useUpdateClientRateSchedule();

  const form = useForm<EditRateScheduleFormData>({
    resolver: zodResolver(editRateScheduleSchema),
    defaultValues: {
      authority_type: schedule.authority_type,
      service_type_codes: schedule.service_type_codes || [],
      start_date: schedule.start_date,
      end_date: schedule.end_date || '',
      days_covered: schedule.days_covered,
      time_from: schedule.time_from,
      time_until: schedule.time_until,
      rate_category: schedule.rate_category,
      pay_based_on: schedule.pay_based_on,
      charge_type: schedule.charge_type,
      base_rate: schedule.base_rate,
      rate_15_minutes: schedule.rate_15_minutes || undefined,
      rate_30_minutes: schedule.rate_30_minutes || undefined,
      rate_45_minutes: schedule.rate_45_minutes || undefined,
      rate_60_minutes: schedule.rate_60_minutes || undefined,
      consecutive_hours_rate: schedule.consecutive_hours_rate || undefined,
      bank_holiday_multiplier: schedule.bank_holiday_multiplier
    }
  });

  const selectedChargeType = form.watch('charge_type');

  useEffect(() => {
    if (open && schedule) {
      form.reset({
        authority_type: schedule.authority_type,
        service_type_codes: schedule.service_type_codes || [],
        start_date: schedule.start_date,
        end_date: schedule.end_date || '',
        days_covered: schedule.days_covered,
        time_from: schedule.time_from,
        time_until: schedule.time_until,
        rate_category: schedule.rate_category,
        pay_based_on: schedule.pay_based_on,
        charge_type: schedule.charge_type,
        base_rate: schedule.base_rate,
        rate_15_minutes: schedule.rate_15_minutes || undefined,
        rate_30_minutes: schedule.rate_30_minutes || undefined,
        rate_45_minutes: schedule.rate_45_minutes || undefined,
        rate_60_minutes: schedule.rate_60_minutes || undefined,
        consecutive_hours_rate: schedule.consecutive_hours_rate || undefined,
        bank_holiday_multiplier: schedule.bank_holiday_multiplier
      });
    }
  }, [open, schedule, form]);

  const onSubmit = (data: EditRateScheduleFormData) => {
    updateSchedule.mutate({
      id: schedule.id,
      ...data
    }, {
      onSuccess: () => {
        onOpenChange(false);
      }
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

  const showIncrementalRates = selectedChargeType.includes('rate_per_minutes') || 
                              selectedChargeType === 'hour_minutes';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rate Schedule</DialogTitle>
          <DialogDescription>
            Update the rate schedule configuration
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="authority_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authorities *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select authority type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="local_authority">Local Authority</SelectItem>
                        <SelectItem value="nhs">NHS</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                        <SelectItem value="charity">Charity</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Days & Time */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Days & Time</h3>
              
              <FormField
                control={form.control}
                name="days_covered"
                render={() => (
                  <FormItem>
                    <FormLabel>Days Covered *</FormLabel>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
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
                                  onCheckedChange={(checked) => toggleDay(key, checked as boolean)}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {label.slice(0, 3)}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="time_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time From *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="time_until"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Until *</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Rate Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rate Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rate_category"
                  render={({ field }) => (
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="pay_based_on"
                  render={({ field }) => (
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="charge_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charge Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select charge type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(chargeTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
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
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate (£) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bank_holiday_multiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Holiday Multiplier</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseFloat(value))} 
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
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
                  )}
                />
              </div>

              {/* Incremental Rates */}
              {showIncrementalRates && (
                <div className="space-y-4">
                  <h4 className="font-medium">Incremental Rates</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="rate_15_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate at 15 min (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate_30_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate at 30 min (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate_45_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate at 45 min (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rate_60_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate at 60 min (£)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              min="0"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="consecutive_hours_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consecutive Hours Rate (£)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0"
                            placeholder="0.00"
                            className="max-w-xs"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="destructive" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateSchedule.isPending}
                className="bg-success text-success-foreground hover:bg-success/90"
              >
                {updateSchedule.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};