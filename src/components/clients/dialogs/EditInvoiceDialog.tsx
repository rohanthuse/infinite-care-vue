
import React from "react";
import { Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

export function EditInvoiceDialog({ open, onOpenChange, invoice }: EditInvoiceDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Edit className="h-5 w-5" />
            Edit Invoice #{invoice.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Modify invoice details, line items, and status
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Edit invoice functionality will be implemented here. This will allow users to:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Update invoice details and amounts</li>
            <li>Modify line items</li>
            <li>Change status and dates</li>
            <li>Add or edit notes</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
