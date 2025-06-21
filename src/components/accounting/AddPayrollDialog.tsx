import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayrollRecord, useStaffList } from "@/hooks/useAccountingData";
import { toast } from "sonner";
import { createDateValidation, createPositiveNumberValidation } from "@/utils/validationUtils";

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

const paymentStatusLabels = {
  pending: "Pending",
  processed: "Processed",
  failed: "Failed"
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
      notes: "",
    },
  });

  const watchedValues = watch();
  const [calculatedTotals, setCalculatedTotals] = useState({ grossPay: 0, netPay: 0 });

  const calculateTotals = () => {
    const basicSalary = Number(watchedValues.basic_salary) || 0;
    const overtimePay = Number(watchedValues.overtime_pay) || 0;
    const bonus = Number(watchedValues.bonus) || 0;
    
    const grossPay = basicSalary + overtimePay + bonus;
    
    const tax = Number(watchedValues.tax_deduction) || 0;
    const ni = Number(watchedValues.ni_deduction) || 0;
    const pension = Number(watchedValues.pension_deduction) || 0;
    const other = Number(watchedValues.other_deductions) || 0;
    
    const totalDeductions = tax + ni + pension + other;
    const netPay = grossPay - totalDeductions;
    
    setCalculatedTotals({ grossPay, netPay });
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payroll Record" : "Add New Payroll Record"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Employee Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Employee Information</h3>
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff Member *</Label>
              {isLoadingStaff ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-500">Loading staff...</span>
                </div>
              ) : staffList.length === 0 ? (
                <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded border">
                  No active staff members found for this branch
                </div>
              ) : (
                <Select 
                  value={watchedValues.staff_id} 
                  onValueChange={(value) => setValue("staff_id", value)}
                >
                  <SelectTrigger className={errors.staff_id ? "border-red-500" : ""}>
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
                <p className="text-sm text-red-600">{errors.staff_id.message}</p>
              )}
            </div>
          </div>

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
                  className={errors.pay_period_start ? "border-red-500" : ""}
                />
                {errors.pay_period_start && (
                  <p className="text-sm text-red-600">{errors.pay_period_start.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_end">To *</Label>
                <Input
                  id="pay_period_end"
                  type="date"
                  {...register("pay_period_end")}
                  className={errors.pay_period_end ? "border-red-500" : ""}
                />
                {errors.pay_period_end && (
                  <p className="text-sm text-red-600">{errors.pay_period_end.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date *</Label>
                <Input
                  id="payment_date"
                  type="date"
                  {...register("payment_date")}
                  className={errors.payment_date ? "border-red-500" : ""}
                />
                {errors.payment_date && (
                  <p className="text-sm text-red-600">{errors.payment_date.message}</p>
                )}
              </div>
            </div>
          </div>

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
                  className={errors.regular_hours ? "border-red-500" : ""}
                />
                {errors.regular_hours && (
                  <p className="text-sm text-red-600">{errors.regular_hours.message}</p>
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
                  className={errors.overtime_hours ? "border-red-500" : ""}
                />
                {errors.overtime_hours && (
                  <p className="text-sm text-red-600">{errors.overtime_hours.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (£) *</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("hourly_rate", { valueAsNumber: true })}
                  className={errors.hourly_rate ? "border-red-500" : ""}
                />
                {errors.hourly_rate && (
                  <p className="text-sm text-red-600">{errors.hourly_rate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary (£) *</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("basic_salary", { valueAsNumber: true })}
                  className={errors.basic_salary ? "border-red-500" : ""}
                />
                {errors.basic_salary && (
                  <p className="text-sm text-red-600">{errors.basic_salary.message}</p>
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
                  className={errors.overtime_pay ? "border-red-500" : ""}
                />
                {errors.overtime_pay && (
                  <p className="text-sm text-red-600">{errors.overtime_pay.message}</p>
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
                  className={errors.bonus ? "border-red-500" : ""}
                />
                {errors.bonus && (
                  <p className="text-sm text-red-600">{errors.bonus.message}</p>
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
                  className={errors.tax_deduction ? "border-red-500" : ""}
                />
                {errors.tax_deduction && (
                  <p className="text-sm text-red-600">{errors.tax_deduction.message}</p>
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
                  className={errors.ni_deduction ? "border-red-500" : ""}
                />
                {errors.ni_deduction && (
                  <p className="text-sm text-red-600">{errors.ni_deduction.message}</p>
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
                  className={errors.pension_deduction ? "border-red-500" : ""}
                />
                {errors.pension_deduction && (
                  <p className="text-sm text-red-600">{errors.pension_deduction.message}</p>
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
                  className={errors.other_deductions ? "border-red-500" : ""}
                />
                {errors.other_deductions && (
                  <p className="text-sm text-red-600">{errors.other_deductions.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-sm">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <p className="text-sm text-red-600">{errors.payment_method.message}</p>
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
                  <p className="text-sm text-red-600">{errors.payment_status.message}</p>
                )}
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

          <div className="flex justify-center">
            <Button 
              type="button" 
              variant="outline" 
              className="gap-2"
              onClick={calculateTotals}
            >
              Calculate Totals
            </Button>
          </div>

          {(calculatedTotals.grossPay > 0 || calculatedTotals.netPay > 0) && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div className="text-center">
                <span className="text-sm text-gray-500">Gross Pay:</span>
                <div className="text-lg font-bold">
                  £{calculatedTotals.grossPay.toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-500">Net Pay:</span>
                <div className="text-lg font-bold">
                  £{calculatedTotals.netPay.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || staffList.length === 0}>
              {isSubmitting ? 'Saving...' : isEditing ? "Save Changes" : "Add Payroll Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayrollDialog;
