import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { MyExpense } from '@/hooks/useMyExpenses';
import { formatCurrency } from '@/utils/currencyFormatter';
import { Receipt, Download, Eye } from 'lucide-react';

interface ViewMyExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  expense: MyExpense | null;
}

export const ViewMyExpenseDialog: React.FC<ViewMyExpenseDialogProps> = ({
  open,
  onClose,
  expense,
}) => {
  if (!expense) return null;

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      rejected: 'bg-destructive/10 text-destructive',
    } as const;

    return (
      <Badge variant="secondary" className={variants[status as keyof typeof variants] || variants.pending}>
        {status}
      </Badge>
    );
  };

  const handleViewReceipt = () => {
    if (expense.receipt_url) {
      window.open(expense.receipt_url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
          <DialogDescription>
            View expense claim details and status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
              <p className="text-sm">{expense.description}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
              {getStatusBadge(expense.status)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Amount</h4>
              <p className="text-lg font-semibold">{formatCurrency(expense.amount)}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Category</h4>
              <p className="text-sm">{expense.category}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Date</h4>
              <p className="text-sm">{format(new Date(expense.expense_date), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Payment Method</h4>
              <p className="text-sm capitalize">{expense.payment_method}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h4>
              <p className="text-sm">{format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm')}</p>
            </div>
          </div>

          {expense.notes && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Notes</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{expense.notes}</p>
            </div>
          )}

          {expense.approved_at && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved Date</h4>
                <p className="text-sm">{format(new Date(expense.approved_at), 'dd/MM/yyyy HH:mm')}</p>
              </div>
              {expense.approved_by && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Approved By</h4>
                  <p className="text-sm">{expense.approved_by}</p>
                </div>
              )}
            </div>
          )}

          {expense.receipt_url && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Receipt</h4>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleViewReceipt}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View Receipt
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};