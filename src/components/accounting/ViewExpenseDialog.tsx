
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Expense, expenseCategoryLabels, expenseStatusLabels, paymentMethodLabels } from "@/types/expense";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, FileText } from "lucide-react";

interface ViewExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  expense: Expense;
}

const ViewExpenseDialog: React.FC<ViewExpenseDialogProps> = ({
  open,
  onClose,
  onEdit,
  expense,
}) => {
  const renderStatusBadge = (status: Expense["status"]) => {
    const variants: Record<Expense["status"], string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <Badge variant="outline" className={`${variants[status]} font-medium`}>
        {expenseStatusLabels[status]}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" /> Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(new Date(expense.date), "PPPP")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Status</p>
              {renderStatusBadge(expense.status)}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium">{expense.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-bold">£{expense.amount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium">
                {expenseCategoryLabels[expense.category]}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">
                {paymentMethodLabels[expense.paymentMethod]}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{expense.createdBy}</p>
            </div>
          </div>

          {expense.receipt && (
            <div>
              <p className="text-sm text-gray-500">Receipt Reference</p>
              <p className="font-medium">{expense.receipt}</p>
            </div>
          )}

          {expense.notes && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Notes</p>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <p>{expense.notes}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewExpenseDialog;
