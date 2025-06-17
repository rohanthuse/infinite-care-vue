
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
        
        <div className="space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Invoice Total:</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount || invoice.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Amount Paid:</span>
              <span className="font-medium">
                {formatCurrency(invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-sm font-medium">Remaining Balance:</span>
              <span className="font-bold text-red-600">{formatCurrency(remainingBalance)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_amount">Payment Amount (£)</Label>
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
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setValue('payment_amount', remainingBalance)}
              >
                Pay Full Amount ({formatCurrency(remainingBalance)})
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select onValueChange={(value) => setValue('payment_method', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_id">Transaction ID (Optional)</Label>
              <Input
                id="transaction_id"
                {...register('transaction_id')}
                placeholder="Transaction reference number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_reference">Payment Reference (Optional)</Label>
              <Input
                id="payment_reference"
                {...register('payment_reference')}
                placeholder="Internal reference"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Additional payment notes"
                rows={3}
              />
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={isSubmitting || !watch('payment_amount') || !watch('payment_method')}
          >
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
