
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PayrollRecord, PaymentMethod, PaymentStatus, paymentMethodLabels, paymentStatusLabels } from "@/types/payroll";
import { v4 as uuidv4 } from 'uuid';

interface AddPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (record: PayrollRecord) => void;
  initialData?: PayrollRecord;
  isEditing?: boolean;
}

const AddPayrollDialog: React.FC<AddPayrollDialogProps> = ({
  open,
  onClose,
  onAdd,
  initialData,
  isEditing = false,
}) => {
  const [payrollData, setPayrollData] = useState<Partial<PayrollRecord>>(
    initialData || {
      employeeId: "",
      employeeName: "",
      jobTitle: "",
      payPeriod: {
        from: new Date().toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
      },
      regularHours: 0,
      overtimeHours: 0,
      basicSalary: 0,
      overtimePay: 0,
      bonus: 0,
      deductions: {
        tax: 0,
        nationalInsurance: 0,
        pension: 0,
        other: 0,
      },
      paymentStatus: "pending" as PaymentStatus,
      paymentMethod: "bank_transfer" as PaymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: "",
    }
  );

  const handleInputChange = (field: string, value: string | number) => {
    setPayrollData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field: "from" | "to", value: string) => {
    setPayrollData((prev) => ({
      ...prev,
      payPeriod: {
        ...prev.payPeriod!,
        [field]: value,
      },
    }));
  };

  const handleDeductionChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPayrollData((prev) => ({
      ...prev,
      deductions: {
        ...prev.deductions!,
        [field]: numValue,
      },
    }));
  };

  const calculateGrossAndNet = () => {
    const basicSalary = Number(payrollData.basicSalary) || 0;
    const overtimePay = Number(payrollData.overtimePay) || 0;
    const bonus = Number(payrollData.bonus) || 0;
    
    const grossPay = basicSalary + overtimePay + bonus;
    
    const tax = Number(payrollData.deductions?.tax) || 0;
    const ni = Number(payrollData.deductions?.nationalInsurance) || 0;
    const pension = Number(payrollData.deductions?.pension) || 0;
    const other = Number(payrollData.deductions?.other) || 0;
    
    const totalDeductions = tax + ni + pension + other;
    const netPay = grossPay - totalDeductions;
    
    setPayrollData((prev) => ({
      ...prev,
      grossPay,
      netPay,
    }));
  };

  const handleSubmit = () => {
    calculateGrossAndNet();
    
    const formattedRecord: PayrollRecord = {
      id: payrollData.id || uuidv4(),
      employeeId: payrollData.employeeId || "",
      employeeName: payrollData.employeeName || "",
      jobTitle: payrollData.jobTitle || "",
      payPeriod: {
        from: payrollData.payPeriod?.from || new Date().toISOString().split('T')[0],
        to: payrollData.payPeriod?.to || new Date().toISOString().split('T')[0],
      },
      regularHours: Number(payrollData.regularHours) || 0,
      overtimeHours: Number(payrollData.overtimeHours) || 0,
      basicSalary: Number(payrollData.basicSalary) || 0,
      overtimePay: Number(payrollData.overtimePay) || 0,
      bonus: Number(payrollData.bonus) || 0,
      deductions: {
        tax: Number(payrollData.deductions?.tax) || 0,
        nationalInsurance: Number(payrollData.deductions?.nationalInsurance) || 0,
        pension: Number(payrollData.deductions?.pension) || 0,
        other: Number(payrollData.deductions?.other) || 0,
      },
      grossPay: Number(payrollData.grossPay) || 0,
      netPay: Number(payrollData.netPay) || 0,
      paymentStatus: payrollData.paymentStatus as PaymentStatus || "pending",
      paymentMethod: payrollData.paymentMethod as PaymentMethod || "bank_transfer",
      paymentDate: payrollData.paymentDate || new Date().toISOString().split('T')[0],
      notes: payrollData.notes,
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={payrollData.employeeId}
                  onChange={(e) => handleInputChange("employeeId", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name</Label>
                <Input
                  id="employeeName"
                  value={payrollData.employeeName}
                  onChange={(e) => handleInputChange("employeeName", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={payrollData.jobTitle}
                  onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Pay Period Information */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Pay Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payPeriodFrom">From</Label>
                <Input
                  id="payPeriodFrom"
                  type="date"
                  value={payrollData.payPeriod?.from}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payPeriodTo">To</Label>
                <Input
                  id="payPeriodTo"
                  type="date"
                  value={payrollData.payPeriod?.to}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={payrollData.paymentDate}
                  onChange={(e) => handleInputChange("paymentDate", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Hours and Pay */}
          <div className="grid grid-cols-1 gap-4 border-t pt-4">
            <h3 className="font-medium text-sm">Hours and Pay</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regularHours">Regular Hours</Label>
                <Input
                  id="regularHours"
                  type="number"
                  value={payrollData.regularHours}
                  onChange={(e) => handleInputChange("regularHours", e.target.value)}
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimeHours">Overtime Hours</Label>
                <Input
                  id="overtimeHours"
                  type="number"
                  value={payrollData.overtimeHours}
                  onChange={(e) => handleInputChange("overtimeHours", e.target.value)}
                  min="0"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary (£)</Label>
                <Input
                  id="basicSalary"
                  type="number"
                  value={payrollData.basicSalary}
                  onChange={(e) => handleInputChange("basicSalary", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtimePay">Overtime Pay (£)</Label>
                <Input
                  id="overtimePay"
                  type="number"
                  value={payrollData.overtimePay}
                  onChange={(e) => handleInputChange("overtimePay", e.target.value)}
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
                <Label htmlFor="tax">Tax (£)</Label>
                <Input
                  id="tax"
                  type="number"
                  value={payrollData.deductions?.tax}
                  onChange={(e) => handleDeductionChange("tax", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalInsurance">National Insurance (£)</Label>
                <Input
                  id="nationalInsurance"
                  type="number"
                  value={payrollData.deductions?.nationalInsurance}
                  onChange={(e) => handleDeductionChange("nationalInsurance", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pension">Pension (£)</Label>
                <Input
                  id="pension"
                  type="number"
                  value={payrollData.deductions?.pension}
                  onChange={(e) => handleDeductionChange("pension", e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other">Other Deductions (£)</Label>
                <Input
                  id="other"
                  type="number"
                  value={payrollData.deductions?.other}
                  onChange={(e) => handleDeductionChange("other", e.target.value)}
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
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  value={payrollData.paymentMethod} 
                  onValueChange={(value) => handleInputChange("paymentMethod", value)}
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
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select 
                  value={payrollData.paymentStatus} 
                  onValueChange={(value) => handleInputChange("paymentStatus", value)}
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
              onClick={calculateGrossAndNet}
            >
              Calculate Totals
            </Button>
          </div>

          {/* Totals Display */}
          {(payrollData.grossPay !== undefined || payrollData.netPay !== undefined) && (
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md">
              <div className="text-center">
                <span className="text-sm text-gray-500">Gross Pay:</span>
                <div className="text-lg font-bold">
                  £{Number(payrollData.grossPay).toFixed(2)}
                </div>
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-500">Net Pay:</span>
                <div className="text-lg font-bold">
                  £{Number(payrollData.netPay).toFixed(2)}
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
