import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string;
  total_amount?: number;
  amount: number;
  client_name?: string;
}

interface DeleteInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}) => {
  if (!invoice) return null;

  // Check if invoice can be deleted (only draft or cancelled)
  const canDelete = invoice.status === 'draft' || invoice.status === 'cancelled';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirm Deletion
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this invoice? This action cannot be undone.
          </p>
          
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Invoice:</span> {invoice.invoice_number}
            </p>
            {invoice.client_name && (
              <p className="text-sm">
                <span className="font-medium">Client:</span> {invoice.client_name}
              </p>
            )}
            <p className="text-sm">
              <span className="font-medium">Amount:</span> £{(invoice.total_amount || invoice.amount).toFixed(2)}
            </p>
            <p className="text-sm">
              <span className="font-medium">Status:</span> {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </p>
          </div>
          
          {!canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Warning:</span> Only draft or cancelled invoices can be deleted. 
                Please change the status first if needed.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading || !canDelete}
          >
            {isLoading ? "Deleting..." : "Delete Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};