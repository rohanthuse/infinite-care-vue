import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useCreateStaffRateSchedule } from "@/hooks/useStaffAccounting";
import { useServices } from "@/data/hooks/useServices";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

// Rate category labels matching client dialog
const rateCategoryLabels: Record<string, string> = {
  standard: 'Standard',
  adult: 'Adult',
  cyp: 'CYP (Children & Young People)',
};

// Pay based on labels matching client dialog
const payBasedOnLabels: Record<string, string> = {
  service: 'Service',
  hours_minutes: 'Hours/Minutes',
  daily_flat_rate: 'Daily Flat Rate',
};

// Day labels
const dayLabels: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  bank_holiday: 'Bank Holiday',
};

const formSchema = z.object({
  service_type_codes: z.array(z.string()).default([]),
  authority_type: z.string().min(1, "Authority type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  days_covered: z.array(z.string()).min(1, "At least one day must be selected"),
  time_from: z.string().min(1, "Start time is required"),
  time_until: z.string().min(1, "End time is required"),
  rate_category: z.enum(['standard', 'adult', 'cyp']).default("standard"),
  pay_based_on: z.enum(['service', 'hours_minutes', 'daily_flat_rate']).default("service"),
  charge_type: z.string().default("hourly_rate"),
  base_rate: z.number().min(0.01, "Base rate is required"),
  bank_holiday_multiplier: z.number().min(1).max(3).optional().default(1),
  is_vatable: z.boolean().default(false),
  vat_rate: z.number().min(0).max(100).optional().default(20),
});

type FormData = z.infer<typeof formSchema>;

interface AddStaffRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  branchId: string;
}

export const AddStaffRateScheduleDialog: React.FC<AddStaffRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  staffId,
  branchId,
}) => {
  const { organization } = useTenant();
  const { data: services = [] } = useServices(organization?.id);
  const createSchedule = useCreateStaffRateSchedule();
  const [enableBankHolidayMultiplier, setEnableBankHolidayMultiplier] = useState(false);

  const serviceTypeOptions: MultiSelectOption[] = services.map(service => ({
    label: service.title,
    value: service.code,
    description: undefined
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      authority_type: "",
      service_type_codes: [],
      start_date: "",
      end_date: "",
      days_covered: [],
      time_from: "09:00",
      time_until: "17:00",
      rate_category: "standard",
      pay_based_on: "service",
      charge_type: "hourly_rate",
      base_rate: 0,
      bank_holiday_multiplier: 1,
      is_vatable: false,
      vat_rate: 20,
    },
  });

  const selectedPayBasedOn = form.watch("pay_based_on");
  const isVatable = form.watch("is_vatable");

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
      staff_id: staffId,
      branch_id: branchId,
      organization_id: organization?.id || '',
      service_type_codes: data.service_type_codes,
      authority_type: data.authority_type,
      start_date: data.start_date,
      end_date: data.end_date || null,
      days_covered: data.days_covered,
      time_from: data.time_from,
      time_until: data.time_until,
      rate_category: data.rate_category,
      pay_based_on: data.pay_based_on,
      charge_type: data.charge_type,
      base_rate: data.base_rate,
      rate_15_minutes: null,
      rate_30_minutes: null,
      rate_45_minutes: null,
      rate_60_minutes: null,
      consecutive_hours_rate: null,
      bank_holiday_multiplier: enableBankHolidayMultiplier ? (data.bank_holiday_multiplier || 1) : 1,
      is_vatable: data.is_vatable,
      vat_rate: data.is_vatable ? (data.vat_rate || 20) : null,
    };

    createSchedule.mutate(scheduleData, {
      onSuccess: () => {
        form.reset();
        onOpenChange(false);
      },
    });
  };

  const onSaveAndAdd = () => {
    form.handleSubmit((data) => {
      const scheduleData = {
        staff_id: staffId,
        branch_id: branchId,
        organization_id: organization?.id || '',
        service_type_codes: data.service_type_codes,
        authority_type: data.authority_type,
        start_date: data.start_date,
        end_date: data.end_date || null,
        days_covered: data.days_covered,
        time_from: data.time_from,
        time_until: data.time_until,
        rate_category: data.rate_category,
        pay_based_on: data.pay_based_on,
        charge_type: data.charge_type,
        base_rate: data.base_rate,
        rate_15_minutes: null,
        rate_30_minutes: null,
        rate_45_minutes: null,
        rate_60_minutes: null,
        consecutive_hours_rate: null,
        bank_holiday_multiplier: enableBankHolidayMultiplier ? (data.bank_holiday_multiplier || 1) : 1,
        is_vatable: data.is_vatable,
        vat_rate: data.is_vatable ? (data.vat_rate || 20) : null,
      };

      createSchedule.mutate(scheduleData, {
        onSuccess: () => {
          form.reset({
            authority_type: "",
            service_type_codes: [],
            start_date: "",
            end_date: "",
            days_covered: [],
            time_from: "09:00",
            time_until: "17:00",
            rate_category: "standard",
            pay_based_on: "service",
            charge_type: "hourly_rate",
            base_rate: 0,
            bank_holiday_multiplier: 1,
            is_vatable: false,
            vat_rate: 20,
          });
          setEnableBankHolidayMultiplier(false);
        },
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
          <DialogTitle>Add Staff Rate Schedule</DialogTitle>
          <DialogDescription>
            Create a new rate schedule for this staff member with specific service and time parameters
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
                    <FormLabel>Authority Type *</FormLabel>
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
                        <SelectItem value="school">School</SelectItem>
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
                name="service_type_codes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Types</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={serviceTypeOptions}
                        selected={field.value || []}
                        onSelectionChange={field.onChange}
                        placeholder="Select service types..."
                        searchPlaceholder="Search services..."
                        emptyText="No services found."
                        maxDisplay={2}
                        showSelectAll={true}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground mt-1">Leave empty to apply to all services</p>
                  </FormItem>
                )}
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {/* Rate Field */}
              <FormField
                control={form.control}
                name="base_rate"
                render={({ field }) => (
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
                )}
              />

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
                  <FormField
                    control={form.control}
                    name="bank_holiday_multiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Holiday Multiplier</FormLabel>
                        <Select 
                          onValueChange={value => field.onChange(parseFloat(value))} 
                          value={field.value?.toString()}
                        >
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
                    )}
                  />
                )}
              </div>
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
                        Enable if this rate should include VAT calculations
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isVatable && (
                <FormField
                  control={form.control}
                  name="vat_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT Rate (%) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          placeholder="20"
                          className="max-w-xs"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={onSaveAndAdd} disabled={createSchedule.isPending}>
                Save & Add Another
              </Button>
              <Button type="submit" disabled={createSchedule.isPending}>
                {createSchedule.isPending ? "Creating..." : "Create Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
