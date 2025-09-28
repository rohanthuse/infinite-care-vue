import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/utils/currencyFormatter';

interface DeleteInvoiceDialogProps {
  invoice: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onConfirm,
  isLoading
}) => {
  if (!invoice) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete invoice <strong>{invoice.invoice_number}</strong>?
            <br />
            <br />
            <div className="space-y-1 text-sm">
              <div>Amount: {formatCurrency(invoice.amount || 0)}</div>
              <div>Status: <span className="capitalize">{invoice.status}</span></div>
              <div>Due Date: {new Date(invoice.due_date).toLocaleDateString()}</div>
            </div>
            <br />
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Invoice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};