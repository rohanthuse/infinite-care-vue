import React from 'react';
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
import { useServiceTypes, useCreateClientRateSchedule } from '@/hooks/useClientAccounting';
import { useTenant } from '@/contexts/TenantContext';
import { 
  RateCategory, 
  PayBasedOn, 
  ChargeType,
  rateCategoryLabels,
  payBasedOnLabels,
  chargeTypeLabels,
  dayLabels
} from '@/types/clientAccounting';

const rateScheduleSchema = z.object({
  authority_type: z.string().min(1, 'Authority type is required'),
  service_type_code: z.string().optional(),
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
  bank_holiday_multiplier: z.number().min(1).max(3).default(1),
  is_vatable: z.boolean()
}).refine((data) => {
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

type RateScheduleFormData = z.infer<typeof rateScheduleSchema>;

interface AddRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  branchId: string;
}

export const AddRateScheduleDialog: React.FC<AddRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  clientId,
  branchId
}) => {
  const { organization } = useTenant();
  const { data: serviceTypes } = useServiceTypes();
  const createSchedule = useCreateClientRateSchedule();

  const form = useForm<RateScheduleFormData>({
    resolver: zodResolver(rateScheduleSchema),
    defaultValues: {
      authority_type: '',
      service_type_code: '',
      start_date: '',
      end_date: '',
      days_covered: [],
      time_from: '',
      time_until: '',
      rate_category: 'standard',
      pay_based_on: 'service',
      charge_type: 'hourly_rate',
      base_rate: 0,
      rate_15_minutes: undefined,
      rate_30_minutes: undefined,
      rate_45_minutes: undefined,
      rate_60_minutes: undefined,
      consecutive_hours_rate: undefined,
      bank_holiday_multiplier: 1,
      is_vatable: false
    }
  });

  const selectedPayBasedOn = form.watch('pay_based_on');
  const selectedChargeType = form.watch('charge_type');

  const onSubmit = (data: RateScheduleFormData) => {
    createSchedule.mutate({
      client_id: clientId,
      branch_id: branchId,
      organization_id: organization?.id || '',
      authority_type: data.authority_type || 'private',
      start_date: data.start_date || '',
      days_covered: data.days_covered || [],
      time_from: data.time_from || '09:00',
      time_until: data.time_until || '17:00',
      rate_category: data.rate_category || 'standard',
      pay_based_on: data.pay_based_on || 'hours_minutes',
      charge_type: data.charge_type || 'hourly_rate',
      base_rate: data.base_rate || 0,
      bank_holiday_multiplier: data.bank_holiday_multiplier || 1,
      is_vatable: data.is_vatable || false,
      ...data
    }, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      }
    });
  };

  const onSaveAndAdd = () => {
    form.handleSubmit((data) => {
      createSchedule.mutate({
        client_id: clientId,
        branch_id: branchId,
        organization_id: organization?.id || '',
        authority_type: data.authority_type || 'private',
        start_date: data.start_date || '',
        days_covered: data.days_covered || [],
        time_from: data.time_from || '09:00',
        time_until: data.time_until || '17:00',
        rate_category: data.rate_category || 'standard',
        pay_based_on: data.pay_based_on || 'hours_minutes',
        charge_type: data.charge_type || 'hourly_rate',
        base_rate: data.base_rate || 0,
        bank_holiday_multiplier: data.bank_holiday_multiplier || 1,
        is_vatable: data.is_vatable || false,
        ...data
      }, {
        onSuccess: () => {
          // Reset form but keep some values for easier multiple entry
          form.reset({
            authority_type: data.authority_type,
            service_type_code: data.service_type_code,
            start_date: data.start_date,
            end_date: data.end_date,
            days_covered: [],
            time_from: '',
            time_until: '',
            rate_category: 'standard',
            pay_based_on: 'service',
            charge_type: 'hourly_rate',
            base_rate: 0,
            rate_15_minutes: undefined,
            rate_30_minutes: undefined,
            rate_45_minutes: undefined,
            rate_60_minutes: undefined,
            consecutive_hours_rate: undefined,
            bank_holiday_multiplier: 1,
            is_vatable: false
          });
        }
      });
    })();
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
          <DialogTitle>Add New Rate Schedule</DialogTitle>
          <DialogDescription>
            Create a new rate schedule for this client with specific service and time parameters
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
                name="service_type_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes?.map((service) => (
                          <SelectItem key={service.code} value={service.code}>
                            {service.name}
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
                render={() => {
                  // Debug logging to verify Bank Holiday is present
                  console.log('Day Labels Available:', dayLabels);
                  console.log('Bank Holiday present:', 'bank_holiday' in dayLabels);
                  
                  return (
                    <FormItem>
                      <FormLabel>Days Covered *</FormLabel>
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
                                    onCheckedChange={(checked) => toggleDay(key, checked as boolean)}
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
                  );
                }}
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

            <Separator />

            {/* VAT Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">VAT Configuration</h3>
              
              <FormField
                control={form.control}
                name="is_vatable"
                render={({ field }) => (
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
                        <Button
                          type="button"
                          variant={field.value === false ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange(false)}
                        >
                          No
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === true ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange(true)}
                        >
                          Yes
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                type="button" 
                variant="default"
                onClick={onSaveAndAdd}
                disabled={createSchedule.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createSchedule.isPending ? 'Adding...' : 'Add Another'}
              </Button>
              <Button 
                type="submit" 
                disabled={createSchedule.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {createSchedule.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};