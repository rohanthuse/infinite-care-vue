
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Download, FileCheck, AlertCircle, Clock, XCircle, User, Calendar, Clock as ClockIcon, PoundSterling } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { exportPayrollPayslip } from "@/utils/payslipPdfGenerator";

// Define payroll-related types locally since we're using database types
interface PayrollRecord {
  id: string;
  staff_id: string;
  branch_id: string;
  pay_period_start: string;
  pay_period_end: string;
  regular_hours: number;
  overtime_hours: number;
  hourly_rate: number;
  overtime_rate?: number;
  basic_salary: number;
  overtime_pay: number;
  bonus: number;
  gross_pay: number;
  tax_deduction: number;
  ni_deduction: number;
  pension_deduction: number;
  other_deductions: number;
  net_pay: number;
  payment_status: string;
  payment_method: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  staff?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other"
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pending",
  processed: "Processed",
  failed: "Failed",
  cancelled: "Cancelled"
};

// Format currency helper
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
};

interface ViewPayrollDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  payrollRecord: PayrollRecord;
}

const ViewPayrollDialog: React.FC<ViewPayrollDialogProps> = ({
  open,
  onClose,
  onEdit,
  payrollRecord,
}) => {
  const { toast } = useToast();

  const handleExportPayslip = () => {
    try {
      exportPayrollPayslip(payrollRecord);
      toast({
        title: "Success",
        description: "Payslip exported successfully",
      });
    } catch (error) {
      console.error('Failed to export payslip:', error);
      toast({
        title: "Error",
        description: "Failed to export payslip",
        variant: "destructive",
      });
    }
  };
  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    let colorClass = "";
    let StatusIcon = Clock;
    
    switch (status) {
      case "processed":
        colorClass = "bg-green-50 text-green-700 border-green-200";
        StatusIcon = FileCheck;
        break;
      case "failed":
        colorClass = "bg-red-50 text-red-700 border-red-200";
        StatusIcon = AlertCircle;
        break;
      case "cancelled":
        colorClass = "bg-gray-100 text-gray-700 border-gray-200";
        StatusIcon = XCircle;
        break;
      default:
        colorClass = "bg-amber-50 text-amber-700 border-amber-200";
        StatusIcon = Clock;
    }

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${colorClass}`}>
        <StatusIcon className="h-3.5 w-3.5" />
        {paymentStatusLabels[payrollRecord.payment_status] || payrollRecord.payment_status}
      </span>
    );
  };

  // Calculate total deductions
  const totalDeductions = 
    payrollRecord.tax_deduction + 
    payrollRecord.ni_deduction + 
    payrollRecord.pension_deduction + 
    payrollRecord.other_deductions;

  const employeeName = payrollRecord.staff 
    ? `${payrollRecord.staff.first_name} ${payrollRecord.staff.last_name}`
    : 'Unknown Employee';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payroll Record Details</span>
            {renderStatusBadge(payrollRecord.payment_status)}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Top section with employee info */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span>Employee</span>
                </div>
                <div className="font-medium text-lg">{employeeName}</div>
                <div className="text-sm text-gray-600">{payrollRecord.staff?.email || 'N/A'}</div>
                <div className="text-sm text-gray-500">ID: {payrollRecord.staff_id}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500">Net Pay</div>
                <div className="font-bold text-xl">{formatCurrency(payrollRecord.net_pay)}</div>
              </div>
            </div>
          </div>

          {/* Pay period details */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Pay Period Details
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Period</div>
                    <div className="font-medium">
                      {format(new Date(payrollRecord.pay_period_start), "PP")} - {format(new Date(payrollRecord.pay_period_end), "PP")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Date</div>
                    <div className="font-medium">
                      {payrollRecord.payment_date ? format(new Date(payrollRecord.payment_date), "PP") : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                    <div className="font-medium">
                      {paymentMethodLabels[payrollRecord.payment_method] || payrollRecord.payment_method}
                    </div>
                  </div>
                  {payrollRecord.payment_reference && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Payment Reference</div>
                      <div className="font-medium">{payrollRecord.payment_reference}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hours and earnings */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                Hours and Earnings
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Regular Hours</div>
                    <div className="font-medium">{payrollRecord.regular_hours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Hours</div>
                    <div className="font-medium">{payrollRecord.overtime_hours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Hourly Rate</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.hourly_rate)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Basic Salary</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.basic_salary)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Pay</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.overtime_pay)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bonus</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.bonus)}</div>
                  </div>
                  <div className="md:col-span-3">
                    <div className="text-sm text-gray-500 mb-1">Gross Pay</div>
                    <div className="font-medium font-bold">{formatCurrency(payrollRecord.gross_pay)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <PoundSterling className="h-4 w-4 mr-1" />
                Deductions
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tax</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.tax_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">National Insurance</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.ni_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pension</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.pension_deduction)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Other Deductions</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.other_deductions)}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-500 mb-1">Total Deductions</div>
                    <div className="font-medium text-red-600 font-bold">-{formatCurrency(totalDeductions)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Gross Pay</div>
                  <div className="font-bold text-lg">{formatCurrency(payrollRecord.gross_pay)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Net Pay</div>
                  <div className="font-bold text-xl text-green-700">{formatCurrency(payrollRecord.net_pay)}</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {payrollRecord.notes && (
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-500 mb-1">Notes</div>
                <p className="text-sm">{payrollRecord.notes}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-between">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="space-x-2">
              <Button variant="outline" className="gap-2" onClick={handleExportPayslip}>
                <Download className="h-4 w-4" />
                Export Payslip
              </Button>
              <Button onClick={onEdit} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewPayrollDialog;
