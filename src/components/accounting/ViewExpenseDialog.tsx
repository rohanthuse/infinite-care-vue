
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExpenseRecord, useApproveExpense, useRejectExpense } from "@/hooks/useAccountingData";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Edit, FileText } from "lucide-react";
import { toast } from "sonner";

interface ViewExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense: ExpenseRecord;
  branchId?: string;
  canApprove?: boolean;
}

const categoryLabels = {
  office_supplies: "Office Supplies",
  travel: "Travel",
  meals: "Meals",
  equipment: "Equipment",
  utilities: "Utilities",
  rent: "Rent",
  software: "Software",
  training: "Training",
  medical_supplies: "Medical Supplies",
  other: "Other"
};

const paymentMethodLabels = {
  credit_card: "Credit Card",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  other: "Other"
};

const statusLabels = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed"
};

const ViewExpenseDialog: React.FC<ViewExpenseDialogProps> = ({
  open,
  onClose,
  expense,
  branchId,
  canApprove = true
}) => {
  const approveExpense = useApproveExpense();
  const rejectExpense = useRejectExpense();

  const handleApprove = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await approveExpense.mutateAsync({ id: expense.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const handleReject = async () => {
    if (!branchId) {
      toast.error('Branch ID not available');
      return;
    }
    
    try {
      await rejectExpense.mutateAsync({ id: expense.id, branchId });
      onClose();
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      reimbursed: "bg-blue-100 text-blue-800 border-blue-200",
    };

    return (
      <Badge variant="outline" className={`${variants[status] || variants.pending} font-medium`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
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
                {format(new Date(expense.expense_date), "PPPP")}
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
                {categoryLabels[expense.category as keyof typeof categoryLabels] || expense.category}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">
                {paymentMethodLabels[expense.payment_method as keyof typeof paymentMethodLabels] || expense.payment_method}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{expense.created_by}</p>
            </div>
          </div>

          {expense.receipt_url && (
            <div>
              <p className="text-sm text-gray-500">Receipt Reference</p>
              <p className="font-medium">{expense.receipt_url}</p>
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
          
          {canApprove && expense.status === 'pending' && (
            <>
              <Button 
                variant="destructive" 
                onClick={handleReject}
                disabled={rejectExpense.isPending}
              >
                {rejectExpense.isPending ? 'Rejecting...' : 'Reject'}
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approveExpense.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {approveExpense.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewExpenseDialog;
