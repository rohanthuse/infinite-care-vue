
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayrollRecord } from "@/hooks/useAccountingData";

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
}) => {
  const [payrollData, setPayrollData] = useState<Partial<PayrollRecord>>(
    initialData || {
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
      gross_pay: 0,
      tax_deduction: 0,
      ni_deduction: 0,
      pension_deduction: 0,
      other_deductions: 0,
      net_pay: 0,
      payment_status: "pending",
      payment_method: "bank_transfer",
      payment_date: new Date().toISOString().split('T')[0],
      notes: "",
    }
  );

  const handleInputChange = (field: string, value: string | number) => {
    setPayrollData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateTotals = () => {
    const basicSalary = Number(payrollData.basic_salary) || 0;
    const overtimePay = Number(payrollData.overtime_pay) || 0;
    const bonus = Number(payrollData.bonus) || 0;
    
    const grossPay = basicSalary + overtimePay + bonus;
    
    const tax = Number(payrollData.tax_deduction) || 0;
    const ni = Number(payrollData.ni_deduction) || 0;
    const pension = Number(payrollData.pension_deduction) || 0;
    const other = Number(payrollData.other_deductions) || 0;
    
    const totalDeductions = tax + ni + pension + other;
    const netPay = grossPay - totalDeductions;
    
    setPayrollData((prev) => ({
      ...prev,
      gross_pay: grossPay,
      net_pay: netPay,
    }));
  };

  const handleSubmit = () => {
    calculateTotals();
    
    const formattedRecord: Partial<PayrollRecord> = {
      ...payrollData,
      regular_hours: Number(payrollData.regular_hours) || 0,
      overtime_hours: Number(payrollData.overtime_hours) || 0,
      hourly_rate: Number(payrollData.hourly_rate) || 0,
      overtime_rate: Number(payrollData.overtime_rate) || 0,
      basic_salary: Number(payrollData.basic_salary) || 0,
      overtime_pay: Number(payrollData.overtime_pay) || 0,
      bonus: Number(payrollData.bonus) || 0,
      gross_pay: Number(payrollData.gross_pay) || 0,
      tax_deduction: Number(payrollData.tax_deduction) || 0,
      ni_deduction: Number(payrollData.ni_deduction) || 0,
      pension_deduction: Number(payrollData.pension_deduction) || 0,
      other_deductions: Number(payrollData.other_deductions) || 0,
      net_pay: Number(payrollData.net_pay) || 0,
    };

    onAdd(formattedRecord);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payroll Record" : "Add New Payroll Record"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Employee Information */}
          <div className="grid grid-cols-1 gap-4">
            <h3 className="font-medium text-sm">Employee Information</h3>
            <div className="space-y-2">
              <Label htmlFor="staff_id">Staff ID</Label>
              <Input
                id="staff_id"
                value={payrollData.staff_id}
                onChange={(e) => handleInputChange("staff_id", e.target.value)}
                placeholder="Enter staff ID"
              />
            </div>
          </div>

          {/* Pay Period Information */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Pay Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay_period_start">From</Label>
                <Input
                  id="pay_period_start"
                  type="date"
                  value={payrollData.pay_period_start}
                  onChange={(e) => handleInputChange("pay_period_start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_period_end">To</Label>
                <Input
                  id="pay_period_end"
                  type="date"
                  value={payrollData.pay_period_end}
                  onChange={(e) => handleInputChange("pay_period_end", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={payrollData.payment_date}
                  onChange={(e) => handleInputChange("payment_date", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hours and Pay */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Hours and Pay</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regular_hours">Regular Hours</Label>
                <Input
                  id="regular_hours"
                  type="number"
                  value={payrollData.regular_hours}
                  onChange={(e) => handleInputChange("regular_hours", e.target.value)}
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime_hours">Overtime Hours</Label>
                <Input
                  id="overtime_hours"
                  type="number"
                  value={payrollData.overtime_hours}
                  onChange={(e) => handleInputChange("overtime_hours", e.target.value)}
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate (£)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  value={payrollData.hourly_rate}
                  onChange={(e) => handleInputChange("hourly_rate", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic_salary">Basic Salary (£)</Label>
                <Input
                  id="basic_salary"
                  type="number"
                  value={payrollData.basic_salary}
                  onChange={(e) => handleInputChange("basic_salary", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime_pay">Overtime Pay (£)</Label>
                <Input
                  id="overtime_pay"
                  type="number"
                  value={payrollData.overtime_pay}
                  onChange={(e) => handleInputChange("overtime_pay", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus (£)</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={payrollData.bonus}
                  onChange={(e) => handleInputChange("bonus", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Deductions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_deduction">Tax (£)</Label>
                <Input
                  id="tax_deduction"
                  type="number"
                  value={payrollData.tax_deduction}
                  onChange={(e) => handleInputChange("tax_deduction", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ni_deduction">National Insurance (£)</Label>
                <Input
                  id="ni_deduction"
                  type="number"
                  value={payrollData.ni_deduction}
                  onChange={(e) => handleInputChange("ni_deduction", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pension_deduction">Pension (£)</Label>
                <Input
                  id="pension_deduction"
                  type="number"
                  value={payrollData.pension_deduction}
                  onChange={(e) => handleInputChange("pension_deduction", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_deductions">Other Deductions (£)</Label>
                <Input
                  id="other_deductions"
                  type="number"
                  value={payrollData.other_deductions}
                  onChange={(e) => handleInputChange("other_deductions", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Select 
                  value={payrollData.payment_method} 
                  onValueChange={(value) => handleInputChange("payment_method", value)}
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select 
                  value={payrollData.payment_status} 
                  onValueChange={(value) => handleInputChange("payment_status", value)}
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
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={payrollData.notes || ""}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Calculate Button */}
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

          {/* Totals Display */}
          {(payrollData.gross_pay !== undefined || payrollData.net_pay !== undefined) && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div className="text-center">
                <span className="text-sm text-gray-500">Gross Pay:</span>
                <div className="text-lg font-bold">
                  £{Number(payrollData.gross_pay || 0).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-500">Net Pay:</span>
                <div className="text-lg font-bold">
                  £{Number(payrollData.net_pay || 0).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>
            {isEditing ? "Save Changes" : "Add Payroll Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayrollDialog;
