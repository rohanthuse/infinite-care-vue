
import React from "react";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

export function AddPaymentDialog({ open, onOpenChange, invoice }: AddPaymentDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for Invoice #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Payment recording functionality will be implemented here. This will allow users to:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Record full or partial payments</li>
            <li>Select payment method</li>
            <li>Add transaction reference</li>
            <li>Automatically update invoice status</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
