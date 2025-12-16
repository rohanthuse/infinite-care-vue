import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Zap, AlertTriangle, Info, ExternalLink, User, PoundSterling, CheckCircle2, Ban, Car } from "lucide-react";
import { PayrollRecord, useStaffList } from "@/hooks/useAccountingData";
import { usePayrollBookingIntegration } from "@/hooks/usePayrollBookingIntegration";
import { useStaffRateSchedules } from "@/hooks/useStaffAccounting";
import { toast } from "sonner";
import { createDateValidation, createPositiveNumberValidation } from "@/utils/validationUtils";
import { rateCategoryLabels } from "@/types/clientAccounting";

const payrollSchema = z.object({
  staff_id: z.string().min(1, "Staff member is required"),
  pay_period_start: createDateValidation("Pay period start date"),
  pay_period_end: createDateValidation("Pay period end date"),
  regular_hours: createPositiveNumberValidation("Regular hours"),
  overtime_hours: createPositiveNumberValidation("Overtime hours"),
  hourly_rate: createPositiveNumberValidation("Hourly rate", 0.01),
  overtime_rate: z.number().min(0, "Overtime rate must be positive").optional(),
  basic_salary: createPositiveNumberValidation("Basic salary"),
  overtime_pay: createPositiveNumberValidation("Overtime pay"),
  bonus: createPositiveNumberValidation("Bonus"),
  tax_deduction: createPositiveNumberValidation("Tax deduction"),
  ni_deduction: createPositiveNumberValidation("NI deduction"),
  pension_deduction: createPositiveNumberValidation("Pension deduction"),
  other_deductions: createPositiveNumberValidation("Other deductions"),
  payment_status: z.enum(["pending", "processed", "failed"]),
  payment_method: z.enum(["bank_transfer", "cash", "cheque", "other"]),
  payment_date: createDateValidation("Payment date"),
  payment_reference: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  const startDate = new Date(data.pay_period_start);
  const endDate = new Date(data.pay_period_end);
  return startDate <= endDate;
}, {
  message: "Pay period start date must be before or equal to end date",
  path: ["pay_period_end"]
}).refine((data) => {
  const endDate = new Date(data.pay_period_end);
  const paymentDate = new Date(data.payment_date);
  return paymentDate >= endDate;
}, {
  message: "Payment date must be on or after pay period end date",
  path: ["payment_date"]
}).refine((data) => {
  const startDate = new Date(data.pay_period_start);
  const endDate = new Date(data.pay_period_end);
  const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
  return diffDays <= 31;
}, {
  message: "Pay period cannot exceed 31 days",
  path: ["pay_period_end"]
});

type PayrollFormData = z.infer<typeof payrollSchema>;

interface AddPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (record: Partial<PayrollRecord>) => void;
  initialData?: PayrollRecord;
  isEditing?: boolean;
  branchId?: string;
}

const paymentMethodLabels = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other"
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  processed: "Processed",
  failed: "Failed"
};

// Parse notes to extract breakdown details (same logic as ViewPayrollDialog)
const parsePayrollNotes = (notes?: string) => {
  if (!notes) return null;
  
  const breakdown = {
    completedBookings: 0,
    cancelledPaidBookings: 0,
    cancelledPayment: 0,
    travelPayment: 0,
    travelType: '',
    extraTimePayment: 0,
    extraTimeCount: 0,
    rateSchedulesApplied: false
  };

  // Parse bookings: "Bookings: X completed, Y cancelled (paid £Z)"
  const bookingsMatch = notes.match(/Bookings:\s*(\d+)\s*completed/);
  if (bookingsMatch) {
    breakdown.completedBookings = parseInt(bookingsMatch[1]);
  }

  const cancelledMatch = notes.match(/(\d+)\s*cancelled\s*\(paid\s*£([\d.]+)\)/);
  if (cancelledMatch) {
    breakdown.cancelledPaidBookings = parseInt(cancelledMatch[1]);
    breakdown.cancelledPayment = parseFloat(cancelledMatch[2]);
  }

  // Parse travel: "Travel: £X (type)"
  const travelMatch = notes.match(/Travel:\s*£([\d.]+)\s*\(([^)]+)\)/);
  if (travelMatch) {
    breakdown.travelPayment = parseFloat(travelMatch[1]);
    breakdown.travelType = travelMatch[2];
  }

  // Parse extra time: "Extra Time: £X (Y approved)"
  const extraTimeMatch = notes.match(/Extra Time:\s*£([\d.]+)\s*\((\d+)\s*approved\)/);
  if (extraTimeMatch) {
    breakdown.extraTimePayment = parseFloat(extraTimeMatch[1]);
    breakdown.extraTimeCount = parseInt(extraTimeMatch[2]);
  }

  // Check for rate schedules
  breakdown.rateSchedulesApplied = notes.includes('Rate schedules applied');

  return breakdown;
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

const AddPayrollDialog: React.FC<AddPayrollDialogProps> = ({
  open,
  onClose,
  onAdd,
  initialData,
  isEditing = false,
  branchId,
}) => {
  // Fetch staff list for the dropdown
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList(branchId);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PayrollFormData>({
    resolver: zodResolver(payrollSchema),
    defaultValues: initialData ? {
      staff_id: initialData.staff_id,
      pay_period_start: initialData.pay_period_start,
      pay_period_end: initialData.pay_period_end,
      regular_hours: initialData.regular_hours,
      overtime_hours: initialData.overtime_hours,
      hourly_rate: initialData.hourly_rate,
      overtime_rate: initialData.overtime_rate || 0,
      basic_salary: initialData.basic_salary,
      overtime_pay: initialData.overtime_pay,
      bonus: initialData.bonus,
      tax_deduction: initialData.tax_deduction,
      ni_deduction: initialData.ni_deduction,
      pension_deduction: initialData.pension_deduction,
      other_deductions: initialData.other_deductions,
      payment_status: initialData.payment_status as any,
      payment_method: initialData.payment_method as any,
      payment_date: initialData.payment_date || new Date().toISOString().split('T')[0],
      payment_reference: initialData.payment_reference || "",
      notes: initialData.notes || "",
    } : {
      staff_id: "",
      pay_period_start: new Date().toISOString().split('T')[0],
      pay_period_end: new Date().toISOString().split('T')[0],
      regular_hours: 0,
      overtime_hours: 0,
      hourly_rate: 0,
      overtime_rate: 0,
      basic_salary: 0,
      overtime_pay: 0,
      bonus: 0,
      tax_deduction: 0,
      ni_deduction: 0,
      pension_deduction: 0,
      other_deductions: 0,
      payment_status: "pending",
      payment_method: "bank_transfer",
      payment_date: new Date().toISOString().split('T')[0],
      payment_reference: "",
      notes: "",
    },
  });

  const watchedValues = watch();
  const [calculatedTotals, setCalculatedTotals] = useState({ grossPay: 0, netPay: 0 });

  // Payroll booking integration
  const { usePayrollCalculationData } = usePayrollBookingIntegration();
  
  // Fetch rate schedules for the selected staff
  const { data: rateSchedules = [], isLoading: isLoadingRates } = useStaffRateSchedules(watchedValues.staff_id);
  
  // Get the active rate schedule (most recent by start date)
  const activeRateSchedule = rateSchedules.find(schedule => schedule.is_active);
  const hasActiveRateSchedule = !!activeRateSchedule;
  
  // Get calculation data for auto-population
  const { data: calculationData } = usePayrollCalculationData(
    branchId,
    watchedValues.staff_id,
    watchedValues.pay_period_start,
    watchedValues.pay_period_end
  );

  // Parse booking breakdown from notes when editing
  const breakdown = useMemo(() => {
    if (isEditing && initialData?.notes) {
      return parsePayrollNotes(initialData.notes);
    }
    return null;
  }, [isEditing, initialData?.notes]);

  // Calculate total deductions
  const totalDeductions = useMemo(() => {
    return (
      (Number(watchedValues.tax_deduction) || 0) +
      (Number(watchedValues.ni_deduction) || 0) +
      (Number(watchedValues.pension_deduction) || 0) +
      (Number(watchedValues.other_deductions) || 0)
    );
  }, [watchedValues.tax_deduction, watchedValues.ni_deduction, watchedValues.pension_deduction, watchedValues.other_deductions]);

  // Auto-calculate totals when values change
  useEffect(() => {
    const basicSalary = Number(watchedValues.basic_salary) || 0;
    const overtimePay = Number(watchedValues.overtime_pay) || 0;
    const bonus = Number(watchedValues.bonus) || 0;
    
    const grossPay = basicSalary + overtimePay + bonus;
    
    const tax = Number(watchedValues.tax_deduction) || 0;
    const ni = Number(watchedValues.ni_deduction) || 0;
    const pension = Number(watchedValues.pension_deduction) || 0;
    const other = Number(watchedValues.other_deductions) || 0;
    
    const totalDed = tax + ni + pension + other;
    const netPay = grossPay - totalDed;
    
    setCalculatedTotals({ grossPay, netPay });
  }, [
    watchedValues.basic_salary,
    watchedValues.overtime_pay,
    watchedValues.bonus,
    watchedValues.tax_deduction,
    watchedValues.ni_deduction,
    watchedValues.pension_deduction,
    watchedValues.other_deductions
  ]);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      if (initialData && isEditing) {
        // Reset form with existing data when editing
        const formData = {
          staff_id: initialData.staff_id,
          pay_period_start: initialData.pay_period_start,
          pay_period_end: initialData.pay_period_end,
          regular_hours: initialData.regular_hours,
          overtime_hours: initialData.overtime_hours,
          hourly_rate: initialData.hourly_rate,
          overtime_rate: initialData.overtime_rate || 0,
          basic_salary: initialData.basic_salary,
          overtime_pay: initialData.overtime_pay,
          bonus: initialData.bonus,
          tax_deduction: initialData.tax_deduction,
          ni_deduction: initialData.ni_deduction,
          pension_deduction: initialData.pension_deduction,
          other_deductions: initialData.other_deductions,
          payment_status: initialData.payment_status as any,
          payment_method: initialData.payment_method as any,
          payment_date: initialData.payment_date || new Date().toISOString().split('T')[0],
          payment_reference: initialData.payment_reference || "",
          notes: initialData.notes || "",
        };
        reset(formData);

        // Calculate totals for existing data
        const grossPay = initialData.basic_salary + initialData.overtime_pay + initialData.bonus;
        const totalDed = initialData.tax_deduction + initialData.ni_deduction + 
                               initialData.pension_deduction + initialData.other_deductions;
        const netPay = grossPay - totalDed;
        setCalculatedTotals({ grossPay, netPay });
      } else {
        // Reset form with default values when adding new record
        const defaultFormData = {
          staff_id: "",
          pay_period_start: new Date().toISOString().split('T')[0],
          pay_period_end: new Date().toISOString().split('T')[0],
          regular_hours: 0,
          overtime_hours: 0,
          hourly_rate: 0,
          overtime_rate: 0,
          basic_salary: 0,
          overtime_pay: 0,
          bonus: 0,
          tax_deduction: 0,
          ni_deduction: 0,
          pension_deduction: 0,
          other_deductions: 0,
          payment_status: "pending" as const,
          payment_method: "bank_transfer" as const,
          payment_date: new Date().toISOString().split('T')[0],
          payment_reference: "",
          notes: "",
        };
        reset(defaultFormData);
        setCalculatedTotals({ grossPay: 0, netPay: 0 });
      }
    }
  }, [open, initialData, isEditing, reset]);

  // Auto-populate rates from rate schedule when staff is selected
  useEffect(() => {
    if (activeRateSchedule && !isEditing) {
      const overtimeMultiplier = activeRateSchedule.overtime_multiplier || 1.5;
      const baseRate = activeRateSchedule.base_rate || 0;
      const overtimeRate = baseRate * overtimeMultiplier;
      
      setValue('hourly_rate', baseRate);
      setValue('overtime_rate', overtimeRate);
    }
  }, [activeRateSchedule, isEditing, setValue]);

  // Auto-populate from booking data
  const autoPopulateFromBookings = () => {
    if (!calculationData) {
      toast.error('No calculation data available for this period');
      return;
    }

    const basicSalary = calculationData.regularHours * calculationData.basHourlyRate;
    const overtimePay = (calculationData.overtimeHours + calculationData.extraTimeHours) * calculationData.overtimeRate;
    const grossPay = basicSalary + overtimePay;
    
    // Calculate deductions (basic estimates)
    const taxRate = 0.20;
    const niRate = 0.12;
    const pensionRate = 0.03;
    
    const taxDeduction = grossPay * taxRate;
    const niDeduction = grossPay * niRate;
    const pensionDeduction = grossPay * pensionRate;

    // Update form values
    setValue('regular_hours', calculationData.regularHours);
    setValue('overtime_hours', calculationData.overtimeHours + calculationData.extraTimeHours);
    setValue('hourly_rate', calculationData.basHourlyRate);
    setValue('overtime_rate', calculationData.overtimeRate);
    setValue('basic_salary', basicSalary);
    setValue('overtime_pay', overtimePay);
    setValue('tax_deduction', taxDeduction);
    setValue('ni_deduction', niDeduction);
    setValue('pension_deduction', pensionDeduction);

    toast.success(`Auto-populated from ${calculationData.bookings.length} bookings`);
  };

  const onSubmit = async (data: PayrollFormData) => {
    try {
      const formattedRecord: Partial<PayrollRecord> = {
        ...data,
        gross_pay: calculatedTotals.grossPay,
        net_pay: calculatedTotals.netPay,
      };

      onAdd(formattedRecord);
      reset();
      onClose();
    } catch (error) {
      console.error('Error saving payroll record:', error);
      toast.error('Failed to save payroll record');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const formatRateValidity = () => {
    if (!activeRateSchedule) return '';
    const start = activeRateSchedule.start_date;
    const end = activeRateSchedule.end_date;
    return end ? `${start} - ${end}` : `${start} - Ongoing`;
  };

  // Get employee name for editing header
  const employeeName = isEditing && initialData?.staff 
    ? `${initialData.staff.first_name} ${initialData.staff.last_name}`
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payroll Record" : "Add New Payroll Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Context Header (Read-Only when Editing) */}
          {isEditing && initialData?.staff ? (
            <div className="bg-muted/50 p-4 rounded-lg border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Employee</span>
                  </div>
                  <div className="font-medium text-lg">{employeeName}</div>
                  <div className="text-sm text-muted-foreground">{initialData.staff.email || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">ID: {initialData.staff_id.slice(0, 8)}...</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge 
                    variant={watchedValues.payment_status === 'processed' ? 'default' : 
                             watchedValues.payment_status === 'failed' ? 'destructive' : 'secondary'}
                  >
                    {paymentStatusLabels[watchedValues.payment_status] || watchedValues.payment_status}
                  </Badge>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Net Pay</div>
                    <div className="font-bold text-lg">{formatCurrency(calculatedTotals.netPay)}</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Employee Selection (Only for New Records) */
            <div className="space-y-4">
              <h3 className="font-medium text-sm">Employee Information</h3>
              <div className="space-y-2">
                <Label htmlFor="staff_id">Staff Member *</Label>
                {isLoadingStaff ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading staff...</span>
                  </div>
                ) : staffList.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded border">
                    No active staff members found for this branch
                  </div>
                ) : (
                  <Select 
                    value={watchedValues.staff_id} 
                    onValueChange={(value) => setValue("staff_id", value)}
                  >
                    <SelectTrigger className={errors.staff_id ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.first_name} {staff.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {errors.staff_id && (
                  <p className="text-sm text-destructive">{errors.staff_id.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Rate Schedule Info Banner - Show after staff selection */}
          {watchedValues.staff_id && !isLoadingRates && (
            <>
              {hasActiveRateSchedule ? (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Info className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-primary">
                        Rate fetched from Staff Rate Schedule
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">Base Rate:</span> £{activeRateSchedule.base_rate.toFixed(2)}/hr
                        </div>
                        <div>
                          <span className="font-medium">Overtime:</span> £{((activeRateSchedule.base_rate || 0) * (activeRateSchedule.overtime_multiplier || 1.5)).toFixed(2)}/hr ({activeRateSchedule.overtime_multiplier || 1.5}x)
                        </div>
                        <div>
                          <span className="font-medium">Category:</span> {rateCategoryLabels[activeRateSchedule.rate_category as keyof typeof rateCategoryLabels] || activeRateSchedule.rate_category}
                        </div>
                        <div>
                          <span className="font-medium">Valid:</span> {formatRateValidity()}
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Overtime after:</span> {activeRateSchedule.overtime_threshold_hours || 40} hours
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 dark:bg-amber-800 p-2 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        No active rate schedule found
                      </div>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Please configure a rate schedule in Staff Management → Rate Tab before creating payroll records.
                        Default rates will be used if you proceed.
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-amber-700 border-amber-300 hover:bg-amber-100 dark:text-amber-200 dark:border-amber-700 dark:hover:bg-amber-800"
                        onClick={() => {
                          toast.info('Navigate to Staff Management → Rate Tab to add a rate schedule');
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Go to Rate Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pay Period Information */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Pay Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay_period_start">From *</Label>
                <Input
                  id="pay_period_start"
                  type="date"
                  {...register("pay_period_start")}
                  className={errors.pay_period_start ? "border-destructive" : ""}
                />
                {errors.pay_period_start && (
                  <p className="text-sm text-destructive">{errors.pay_period_start.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_end">To *</Label>
                <Input
                  id="pay_period_end"
                  type="date"
                  {...register("pay_period_end")}
                  className={errors.pay_period_end ? "border-destructive" : ""}
                />
                {errors.pay_period_end && (
                  <p className="text-sm text-destructive">{errors.pay_period_end.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  {...register("payment_date")}
                  className={errors.payment_date ? "border-destructive" : ""}
                />
                {errors.payment_date && (
                  <p className="text-sm text-destructive">{errors.payment_date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Breakdown (Read-Only when Editing) */}
          {isEditing && breakdown && (breakdown.completedBookings > 0 || breakdown.cancelledPaidBookings > 0 || breakdown.travelPayment > 0 || breakdown.extraTimePayment > 0) && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <PoundSterling className="h-4 w-4" />
                Booking Breakdown
                <Badge variant="secondary" className="text-xs">Read-only</Badge>
              </h3>
              <div className="bg-muted/30 p-4 rounded-lg border space-y-3">
                {/* Rate Schedule Indicator */}
                <div className="flex items-center gap-2 mb-3">
                  {breakdown.rateSchedulesApplied ? (
                    <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Staff rate schedules applied
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Default rates used
                    </Badge>
                  )}
                </div>

                {/* Completed Bookings */}
                {breakdown.completedBookings > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Completed Bookings
                    </span>
                    <span className="font-medium">{breakdown.completedBookings} bookings</span>
                  </div>
                )}

                {/* Cancelled Bookings (Paid) */}
                {breakdown.cancelledPaidBookings > 0 && (
                  <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                    <span className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
                      <Ban className="h-4 w-4" />
                      Cancelled Bookings (Staff Payable)
                    </span>
                    <div className="text-right">
                      <span className="font-medium text-amber-800 dark:text-amber-200">{breakdown.cancelledPaidBookings} bookings</span>
                      <span className="text-amber-700 dark:text-amber-300 ml-2">({formatCurrency(breakdown.cancelledPayment)})</span>
                    </div>
                  </div>
                )}

                {/* Travel Reimbursement */}
                {breakdown.travelPayment > 0 && (
                  <div className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 p-2 rounded">
                    <span className="text-sm flex items-center gap-2 text-green-800 dark:text-green-200">
                      <Car className="h-4 w-4" />
                      Travel Reimbursement
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:text-green-300">
                        {breakdown.travelType}
                      </Badge>
                    </span>
                    <span className="font-medium text-green-800 dark:text-green-200">{formatCurrency(breakdown.travelPayment)}</span>
                  </div>
                )}

                {/* Extra Time Payment */}
                {breakdown.extraTimePayment > 0 && (
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    <span className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-200">
                      <Clock className="h-4 w-4" />
                      Approved Extra Time
                    </span>
                    <div className="text-right">
                      <span className="font-medium text-blue-800 dark:text-blue-200">{breakdown.extraTimeCount} records</span>
                      <span className="text-blue-700 dark:text-blue-300 ml-2">({formatCurrency(breakdown.extraTimePayment)})</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Auto-populate from bookings */}
          {calculationData && calculationData.bookings.length > 0 && !isEditing && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      Booking Data Available
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {calculationData.bookings.length} bookings, {calculationData.totalActualHours.toFixed(1)} total hours
                      {calculationData.rateSchedulesApplied && (
                        <span className="ml-2 text-primary">(Rate schedules applied)</span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoPopulateFromBookings}
                  className="border-primary/30 text-primary hover:bg-primary/10"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Auto-populate
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Hours and Pay</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regular_hours">Regular Hours *</Label>
                <Input
                  id="regular_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register("regular_hours", { valueAsNumber: true })}
                  className={errors.regular_hours ? "border-destructive" : ""}
                />
                {errors.regular_hours && (
                  <p className="text-sm text-destructive">{errors.regular_hours.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime_hours">Overtime Hours *</Label>
                <Input
                  id="overtime_hours"
                  type="number"
                  step="0.5"
                  min="0"
                  {...register("overtime_hours", { valueAsNumber: true })}
                  className={errors.overtime_hours ? "border-destructive" : ""}
                />
                {errors.overtime_hours && (
                  <p className="text-sm text-destructive">{errors.overtime_hours.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">
                  Hourly Rate (£) *
                  {hasActiveRateSchedule && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">(from schedule)</span>
                  )}
                </Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("hourly_rate", { valueAsNumber: true })}
                  className={`${errors.hourly_rate ? "border-destructive" : ""} ${hasActiveRateSchedule ? "bg-muted/50" : ""}`}
                  readOnly={hasActiveRateSchedule && !isEditing}
                />
                {errors.hourly_rate && (
                  <p className="text-sm text-destructive">{errors.hourly_rate.message}</p>
                )}
              </div>
              {/* Overtime Rate Field */}
              <div className="space-y-2">
                <Label htmlFor="overtime_rate">
                  Overtime Rate (£)
                  {hasActiveRateSchedule && (
                    <span className="ml-1 text-xs text-muted-foreground font-normal">
                      ({activeRateSchedule?.overtime_multiplier || 1.5}x)
                    </span>
                  )}
                </Label>
                <Input
                  id="overtime_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("overtime_rate", { valueAsNumber: true })}
                  className={hasActiveRateSchedule ? "bg-muted/50" : ""}
                  readOnly={hasActiveRateSchedule && !isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary (£) *</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("basic_salary", { valueAsNumber: true })}
                  className={errors.basic_salary ? "border-destructive" : ""}
                />
                {errors.basic_salary && (
                  <p className="text-sm text-destructive">{errors.basic_salary.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime_pay">Overtime Pay (£) *</Label>
                <Input
                  id="overtime_pay"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("overtime_pay", { valueAsNumber: true })}
                  className={errors.overtime_pay ? "border-destructive" : ""}
                />
                {errors.overtime_pay && (
                  <p className="text-sm text-destructive">{errors.overtime_pay.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus (£) *</Label>
                <Input
                  id="bonus"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("bonus", { valueAsNumber: true })}
                  className={errors.bonus ? "border-destructive" : ""}
                />
                {errors.bonus && (
                  <p className="text-sm text-destructive">{errors.bonus.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_deduction">Tax (£) *</Label>
                <Input
                  id="tax_deduction"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("tax_deduction", { valueAsNumber: true })}
                  className={errors.tax_deduction ? "border-destructive" : ""}
                />
                {errors.tax_deduction && (
                  <p className="text-sm text-destructive">{errors.tax_deduction.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ni_deduction">National Insurance (£) *</Label>
                <Input
                  id="ni_deduction"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("ni_deduction", { valueAsNumber: true })}
                  className={errors.ni_deduction ? "border-destructive" : ""}
                />
                {errors.ni_deduction && (
                  <p className="text-sm text-destructive">{errors.ni_deduction.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pension_deduction">Pension (£) *</Label>
                <Input
                  id="pension_deduction"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("pension_deduction", { valueAsNumber: true })}
                  className={errors.pension_deduction ? "border-destructive" : ""}
                />
                {errors.pension_deduction && (
                  <p className="text-sm text-destructive">{errors.pension_deduction.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_deductions">Other Deductions (£) *</Label>
                <Input
                  id="other_deductions"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("other_deductions", { valueAsNumber: true })}
                  className={errors.other_deductions ? "border-destructive" : ""}
                />
                {errors.other_deductions && (
                  <p className="text-sm text-destructive">{errors.other_deductions.message}</p>
                )}
              </div>
            </div>
            {/* Total Deductions Display */}
            <div className="md:col-span-4 pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Total Deductions</span>
                <span className="font-bold text-destructive">
                  -{formatCurrency(totalDeductions)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method *</Label>
                <Select 
                  value={watchedValues.payment_method} 
                  onValueChange={(value) => setValue("payment_method", value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_method && (
                  <p className="text-sm text-destructive">{errors.payment_method.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status *</Label>
                <Select 
                  value={watchedValues.payment_status} 
                  onValueChange={(value) => setValue("payment_status", value as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(paymentStatusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.payment_status && (
                  <p className="text-sm text-destructive">{errors.payment_status.message}</p>
                )}
              </div>
              {/* Payment Reference Field */}
              <div className="space-y-2">
                <Label htmlFor="payment_reference">Payment Reference</Label>
                <Input
                  id="payment_reference"
                  placeholder="e.g. TXN-123456"
                  {...register("payment_reference")}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register("notes")}
                rows={3}
              />
            </div>
          </div>

          {/* Summary Section - Always visible with auto-calculated values */}
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg border">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Gross Pay</span>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(calculatedTotals.grossPay)}
              </div>
            </div>
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Net Pay</span>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(calculatedTotals.netPay)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || (!isEditing && staffList.length === 0)}>
              {isSubmitting ? 'Saving...' : isEditing ? "Save Changes" : "Add Payroll Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayrollDialog;
