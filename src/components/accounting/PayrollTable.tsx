import React, { useState } from "react";
import { PayrollRecord } from "@/hooks/useAccountingData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  FileCheck, 
  AlertCircle, 
  XCircle, 
  Clock,
  Share2,
  Download,
  MoreHorizontal
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PayrollTableProps {
  payrollRecords: PayrollRecord[];
  onViewRecord: (record: PayrollRecord) => void;
  onEditRecord: (record: PayrollRecord) => void;
  onDeleteRecord: (recordId: string) => void;
  onShareRecord?: (record: PayrollRecord) => void;
  onDownloadPayslip?: (record: PayrollRecord) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

const PayrollTable: React.FC<PayrollTableProps> = ({
  payrollRecords,
  onViewRecord,
  onEditRecord,
  onDeleteRecord,
  onShareRecord,
  onDownloadPayslip,
  canEdit = true,
  canDelete = true,
}) => {
  // Track which dropdown is open to prevent multiple dropdowns
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Helper to close dropdown before triggering action (prevents UI freeze)
  const handleDropdownAction = (action: () => void) => {
    setOpenDropdownId(null);
    // Use setTimeout to ensure dropdown closes before action executes
    setTimeout(action, 0);
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <FileCheck className="h-3.5 w-3.5" />
            <span>Processed</span>
          </div>
        );
      case "failed":
        return (
          <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Failed</span>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-1.5 text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <XCircle className="h-3.5 w-3.5" />
            <span>Cancelled</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded-full text-xs font-medium w-fit">
            <Clock className="h-3.5 w-3.5" />
            <span>Pending</span>
          </div>
        );
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Employee</TableHead>
            <TableHead>Pay Period</TableHead>
            <TableHead className="text-right">Hours</TableHead>
            <TableHead className="text-right">Gross Pay</TableHead>
            <TableHead className="text-right">Deductions</TableHead>
            <TableHead className="text-right">Net Pay</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right w-[60px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrollRecords.map((record) => {
            const totalDeductions = 
              record.tax_deduction + 
              record.ni_deduction + 
              record.pension_deduction + 
              record.other_deductions;
              
            return (
              <TableRow key={record.id}>
                <TableCell>
                  <div className="font-medium">
                    {record.staff 
                      ? `${record.staff.first_name} ${record.staff.last_name}`
                      : "Unknown Employee"
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {record.staff?.email || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {new Date(record.pay_period_start).toLocaleDateString()} - {new Date(record.pay_period_end).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Payment: {record.payment_date ? new Date(record.payment_date).toLocaleDateString() : "Not set"}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>{record.regular_hours}</div>
                  {record.overtime_hours > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +{record.overtime_hours} OT
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(record.gross_pay)}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  -{formatCurrency(totalDeductions)}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(record.net_pay)}
                </TableCell>
                <TableCell>{renderStatusBadge(record.payment_status)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu
                      open={openDropdownId === record.id}
                      onOpenChange={(open) => setOpenDropdownId(open ? record.id : null)}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="Open actions menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-popover">
                        {/* View - Always visible */}
                        <DropdownMenuItem 
                          onClick={() => handleDropdownAction(() => onViewRecord(record))}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View Payroll</span>
                        </DropdownMenuItem>

                        {/* Edit - Permission based */}
                        {canEdit && (
                          <DropdownMenuItem 
                            onClick={() => handleDropdownAction(() => onEditRecord(record))}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            <span>Edit Payroll</span>
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {/* Share - If handler provided */}
                        {onShareRecord && (
                          <DropdownMenuItem 
                            onClick={() => handleDropdownAction(() => onShareRecord(record))}
                          >
                            <Share2 className="mr-2 h-4 w-4" />
                            <span>Share Payroll</span>
                          </DropdownMenuItem>
                        )}

                        {/* Download - If handler provided */}
                        {onDownloadPayslip && (
                          <DropdownMenuItem 
                            onClick={() => handleDropdownAction(() => onDownloadPayslip(record))}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            <span>Download Payslip</span>
                          </DropdownMenuItem>
                        )}

                        {/* Delete - Permission based, destructive styling */}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDropdownAction(() => onDeleteRecord(record.id))}
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete Payroll</span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default PayrollTable;
