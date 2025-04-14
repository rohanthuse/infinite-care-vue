
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PayrollRecord, paymentMethodLabels, paymentStatusLabels } from "@/types/payroll";
import { Edit, Download, FileCheck, AlertCircle, Clock, XCircle, User, Calendar, Clock as ClockIcon, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

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
        {paymentStatusLabels[payrollRecord.paymentStatus]}
      </span>
    );
  };

  // Calculate total deductions
  const totalDeductions = 
    payrollRecord.deductions.tax + 
    payrollRecord.deductions.nationalInsurance + 
    payrollRecord.deductions.pension + 
    payrollRecord.deductions.other;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payroll Record Details</span>
            {renderStatusBadge(payrollRecord.paymentStatus)}
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
                <div className="font-medium text-lg">{payrollRecord.employeeName}</div>
                <div className="text-sm text-gray-600">{payrollRecord.jobTitle}</div>
                <div className="text-sm text-gray-500">ID: {payrollRecord.employeeId}</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm text-gray-500">Net Pay</div>
                <div className="font-bold text-xl">{formatCurrency(payrollRecord.netPay)}</div>
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
                      {format(new Date(payrollRecord.payPeriod.from), "PP")} - {format(new Date(payrollRecord.payPeriod.to), "PP")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Date</div>
                    <div className="font-medium">
                      {format(new Date(payrollRecord.paymentDate), "PP")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Payment Method</div>
                    <div className="font-medium">
                      {paymentMethodLabels[payrollRecord.paymentMethod]}
                    </div>
                  </div>
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
                    <div className="font-medium">{payrollRecord.regularHours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Hours</div>
                    <div className="font-medium">{payrollRecord.overtimeHours}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Basic Salary</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.basicSalary)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Overtime Pay</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.overtimePay)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Bonus</div>
                    <div className="font-medium">{formatCurrency(payrollRecord.bonus)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Gross Pay</div>
                    <div className="font-medium font-bold">{formatCurrency(payrollRecord.grossPay)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Deductions
              </h3>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Tax</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.deductions.tax)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">National Insurance</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.deductions.nationalInsurance)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Pension</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.deductions.pension)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Other Deductions</div>
                    <div className="font-medium text-red-600">-{formatCurrency(payrollRecord.deductions.other)}</div>
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
                  <div className="font-bold text-lg">{formatCurrency(payrollRecord.grossPay)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500 mb-1">Net Pay</div>
                  <div className="font-bold text-xl text-green-700">{formatCurrency(payrollRecord.netPay)}</div>
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
              <Button variant="outline" className="gap-2">
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
