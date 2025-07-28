import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { usePaymentRecord } from "@/hooks/useBranchPayments";

interface PaymentRecord {
  id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  payment_reference?: string;
  transaction_id?: string;
  notes?: string;
  client_name: string;
  client_pin_code: string;
  invoice_number: string;
  invoice_description?: string;
}

interface ViewPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentId?: string | null;
}

const getPaymentMethodBadge = (method: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    cash: "default",
    card: "secondary",
    bank_transfer: "outline",
    cheque: "outline",
    direct_debit: "secondary",
  };
  
  return (
    <Badge variant={variants[method] || "default"}>
      {method.replace(/_/g, " ").toUpperCase()}
    </Badge>
  );
};

export const ViewPaymentDialog: React.FC<ViewPaymentDialogProps> = ({
  open,
  onOpenChange,
  paymentId,
}) => {
  const { data: payment, isLoading } = usePaymentRecord(paymentId || "");

  if (!open || !paymentId) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!payment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <p className="text-muted-foreground">Payment not found</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Record Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Date</label>
                <p className="text-sm font-medium">
                  {format(new Date(payment.payment_date), "PPP")}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount</label>
                <p className="text-lg font-bold text-primary">
                  £{payment.payment_amount.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                <div className="mt-1">
                  {getPaymentMethodBadge(payment.payment_method)}
                </div>
              </div>
              {payment.payment_reference && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reference</label>
                  <p className="text-sm font-medium">{payment.payment_reference}</p>
                </div>
              )}
              {payment.transaction_id && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Transaction ID</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {payment.transaction_id}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Client Name</label>
                <p className="text-sm font-medium">{payment.client_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">PIN Code</label>
                <p className="text-sm font-medium">{payment.client_pin_code}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Invoice Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Invoice Number</label>
                <p className="text-sm font-medium">{payment.invoice_number}</p>
              </div>
              {payment.invoice_description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{payment.invoice_description}</p>
                </div>
              )}
            </div>
          </div>

          {payment.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Notes</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{payment.notes}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};