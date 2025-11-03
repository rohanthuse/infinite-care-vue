import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useTenant } from "@/contexts/TenantContext";
import { useUpdateStaffRateSchedule, StaffRateSchedule } from "@/hooks/useStaffAccounting";
import { useServices } from "@/data/hooks/useServices";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";

const formSchema = z.object({
  service_type_codes: z.array(z.string()).default([]),
  authority_type: z.string().min(1, "Authority type is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  days_covered: z.array(z.string()).min(1, "At least one day must be selected"),
  time_from: z.string().min(1, "Start time is required"),
  time_until: z.string().min(1, "End time is required"),
  rate_category: z.string().default("standard"),
  pay_based_on: z.string().default("service"),
  charge_type: z.string().default("hourly_rate"),
  base_rate: z.string().min(1, "Base rate is required"),
  rate_15_minutes: z.string().optional(),
  rate_30_minutes: z.string().optional(),
  rate_45_minutes: z.string().optional(),
  rate_60_minutes: z.string().optional(),
  consecutive_hours_rate: z.string().optional(),
  bank_holiday_multiplier: z.string().default("1.0"),
  is_vatable: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

interface EditStaffRateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: StaffRateSchedule;
  staffId: string;
  branchId: string;
}

const DAYS_OF_WEEK = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
  { label: "Bank Holiday", value: "Bank Holiday" },
];

export const EditStaffRateScheduleDialog: React.FC<EditStaffRateScheduleDialogProps> = ({
  open,
  onOpenChange,
  schedule,
  staffId,
  branchId,
}) => {
  const { organization } = useTenant();
  const { data: services = [] } = useServices();
  const updateSchedule = useUpdateStaffRateSchedule();

  const serviceTypeOptions: MultiSelectOption[] = services.map(service => ({
    label: service.title,
    value: service.code,
    description: undefined
  }));

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service_type_codes: schedule.service_type_codes || [],
      authority_type: schedule.authority_type,
      start_date: schedule.start_date,
      end_date: schedule.end_date || "",
      days_covered: schedule.days_covered,
      time_from: schedule.time_from,
      time_until: schedule.time_until,
      rate_category: schedule.rate_category,
      pay_based_on: schedule.pay_based_on,
      charge_type: schedule.charge_type,
      base_rate: schedule.base_rate.toString(),
      rate_15_minutes: schedule.rate_15_minutes?.toString() || "",
      rate_30_minutes: schedule.rate_30_minutes?.toString() || "",
      rate_45_minutes: schedule.rate_45_minutes?.toString() || "",
      rate_60_minutes: schedule.rate_60_minutes?.toString() || "",
      consecutive_hours_rate: schedule.consecutive_hours_rate?.toString() || "",
      bank_holiday_multiplier: schedule.bank_holiday_multiplier.toString(),
      is_vatable: schedule.is_vatable,
    },
  });

  useEffect(() => {
    if (schedule) {
      form.reset({
        service_type_codes: schedule.service_type_codes || [],
        authority_type: schedule.authority_type,
        start_date: schedule.start_date,
        end_date: schedule.end_date || "",
        days_covered: schedule.days_covered,
        time_from: schedule.time_from,
        time_until: schedule.time_until,
        rate_category: schedule.rate_category,
        pay_based_on: schedule.pay_based_on,
        charge_type: schedule.charge_type,
        base_rate: schedule.base_rate.toString(),
        rate_15_minutes: schedule.rate_15_minutes?.toString() || "",
        rate_30_minutes: schedule.rate_30_minutes?.toString() || "",
        rate_45_minutes: schedule.rate_45_minutes?.toString() || "",
        rate_60_minutes: schedule.rate_60_minutes?.toString() || "",
        consecutive_hours_rate: schedule.consecutive_hours_rate?.toString() || "",
        bank_holiday_multiplier: schedule.bank_holiday_multiplier.toString(),
        is_vatable: schedule.is_vatable,
      });
    }
  }, [schedule, form]);

  const chargeType = form.watch("charge_type");
  const showIncrementalRates = chargeType === "incremental_rate" || chargeType === "consecutive_hours";

  const onSubmit = (data: FormData) => {
    const scheduleData = {
      id: schedule.id,
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
      base_rate: parseFloat(data.base_rate),
      rate_15_minutes: data.rate_15_minutes ? parseFloat(data.rate_15_minutes) : null,
      rate_30_minutes: data.rate_30_minutes ? parseFloat(data.rate_30_minutes) : null,
      rate_45_minutes: data.rate_45_minutes ? parseFloat(data.rate_45_minutes) : null,
      rate_60_minutes: data.rate_60_minutes ? parseFloat(data.rate_60_minutes) : null,
      consecutive_hours_rate: data.consecutive_hours_rate ? parseFloat(data.consecutive_hours_rate) : null,
      bank_holiday_multiplier: parseFloat(data.bank_holiday_multiplier),
      is_vatable: data.is_vatable,
    };

    updateSchedule.mutate(scheduleData, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Rate Schedule</DialogTitle>
          <DialogDescription>
            Update rate schedule details for this staff member
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Days Covered */}
              <FormField
                control={form.control}
                name="days_covered"
                render={() => (
                  <FormItem>
                    <FormLabel>Days Covered *</FormLabel>
                    <div className="grid grid-cols-4 gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="days_covered"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(day.value)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), day.value]
                                      : field.value?.filter((v) => v !== day.value);
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="!mt-0 text-sm font-normal cursor-pointer">
                                {day.label}
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

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-4">
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

            {/* Rate Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Rate Configuration</h3>
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="rate_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="weekend">Weekend</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
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
                      <FormLabel>Pay Based On</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="time">Time</SelectItem>
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
                      <FormLabel>Charge Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly_rate">Hourly Rate</SelectItem>
                          <SelectItem value="incremental_rate">Incremental Rate</SelectItem>
                          <SelectItem value="consecutive_hours">Consecutive Hours</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="base_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Rate (£) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1.0">1x</SelectItem>
                          <SelectItem value="1.25">1.25x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2.0">2x</SelectItem>
                          <SelectItem value="2.5">2.5x</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_vatable"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2 pt-8">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Apply VAT</FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              {/* Incremental Rates */}
              {showIncrementalRates && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Incremental Rates</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="rate_15_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>15 Minutes (£)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rate_30_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>30 Minutes (£)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rate_45_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>45 Minutes (£)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="rate_60_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>60 Minutes (£)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  {chargeType === "consecutive_hours" && (
                    <FormField
                      control={form.control}
                      name="consecutive_hours_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Consecutive Hours Rate (£)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSchedule.isPending}>
                {updateSchedule.isPending ? "Updating..." : "Update Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
