
import React, { useState } from "react";
import { CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useForm } from "react-hook-form";
import { EnhancedClientBilling, useAddPaymentRecord } from "@/hooks/useEnhancedClientBilling";
import { formatCurrency } from "@/utils/currencyFormatter";
import { toast } from "sonner";

interface AddPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

interface PaymentFormData {
  payment_amount: number;
  payment_method: string;
  transaction_id: string;
  payment_reference: string;
  notes: string;
}

export function AddPaymentDialog({ open, onOpenChange, invoice }: AddPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, reset } = useForm<PaymentFormData>();
  const addPaymentMutation = useAddPaymentRecord();

  const calculateRemainingBalance = () => {
    if (!invoice) return 0;
    const totalAmount = invoice.total_amount || invoice.amount;
    const totalPaid = invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
    return Math.max(0, totalAmount - totalPaid);
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!invoice) return;

    setIsSubmitting(true);
    try {
      await addPaymentMutation.mutateAsync({
        invoice_id: invoice.id,
        payment_amount: data.payment_amount,
        payment_method: data.payment_method,
        transaction_id: data.transaction_id || undefined,
        payment_reference: data.payment_reference || undefined,
        notes: data.notes || undefined,
      });

      toast.success('Payment recorded successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingBalance = calculateRemainingBalance();

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CreditCard className="h-5 w-5" />
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment for Invoice #{invoice.invoice_number}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">Invoice Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Invoice Total:</span>
                    <span className="font-medium">{formatCurrency(invoice.total_amount || invoice.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount Paid:</span>
                    <span className="font-medium">
                      {formatCurrency(invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-l pl-4">
                  <span className="text-sm font-medium">Remaining Balance:</span>
                  <span className="font-bold text-destructive text-lg">{formatCurrency(remainingBalance)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Payment Amount Section */}
              <div className="space-y-3">
                <Label htmlFor="payment_amount" className="text-base font-medium">Payment Amount (£)</Label>
                <div className="flex gap-3">
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    max={remainingBalance}
                    {...register('payment_amount', { 
                      required: true, 
                      valueAsNumber: true,
                      max: remainingBalance 
                    })}
                    placeholder="0.00"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    onClick={() => setValue('payment_amount', remainingBalance)}
                    className="whitespace-nowrap"
                  >
                    Pay Full Amount
                  </Button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label htmlFor="payment_method" className="text-base font-medium">Payment Method</Label>
                <Select onValueChange={(value) => setValue('payment_method', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent className="z-[60] bg-background">
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction_id">Transaction ID</Label>
                  <Input
                    id="transaction_id"
                    {...register('transaction_id')}
                    placeholder="Transaction reference number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_reference">Payment Reference</Label>
                  <Input
                    id="payment_reference"
                    {...register('payment_reference')}
                    placeholder="Internal reference"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Additional payment notes"
                  rows={3}
                />
              </div>
            </form>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={isSubmitting || !watch('payment_amount') || !watch('payment_method')}
            className="min-w-[120px]"
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
