
import React from "react";
import { Eye, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-blue-600">
                <Eye className="h-5 w-5" />
                Invoice #{invoice.invoice_number}
              </DialogTitle>
              <DialogDescription>
                View detailed invoice information and download PDF
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600">
            Invoice preview functionality will be implemented here. This will show:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
            <li>Professional invoice layout</li>
            <li>All line items and calculations</li>
            <li>Payment history</li>
            <li>Company branding and terms</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
