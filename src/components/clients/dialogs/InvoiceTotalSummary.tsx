import React from 'react';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyFormatter';

interface InvoiceTotalSummaryProps {
  lineItemsTotal: number;
  expensesTotal: number;
  extraTimeTotal: number;
  extraTimeFormatted: string;
  cancelledBookingFees: number;
  vatPercentage?: number;
}

export function InvoiceTotalSummary({
  lineItemsTotal,
  expensesTotal,
  extraTimeTotal,
  extraTimeFormatted,
  cancelledBookingFees,
  vatPercentage = 20,
}: InvoiceTotalSummaryProps) {
  const subtotalBeforeVat = lineItemsTotal + expensesTotal + extraTimeTotal + cancelledBookingFees;
  const vatAmount = subtotalBeforeVat * (vatPercentage / 100);
  const grandTotal = subtotalBeforeVat + vatAmount;

  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border">
      <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
        <Calculator className="h-4 w-4 text-primary" />
        Invoice Total Summary
      </h3>
      <div className="space-y-3">
        {/* Service Charges (Line Items) */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Service Charges (Line Items):</span>
          <span className="font-medium">{formatCurrency(lineItemsTotal)}</span>
        </div>

        {/* Additional Expenses */}
        {expensesTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Additional Expenses:</span>
            <span className="font-medium">{formatCurrency(expensesTotal)}</span>
          </div>
        )}

        {/* Extra Time Charges */}
        {extraTimeTotal > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Extra Time Charges ({extraTimeFormatted}):
            </span>
            <span className="font-medium">{formatCurrency(extraTimeTotal)}</span>
          </div>
        )}

        {/* Cancelled Booking Fees */}
        {cancelledBookingFees > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cancelled Booking Fees:</span>
            <span className="font-medium">{formatCurrency(cancelledBookingFees)}</span>
          </div>
        )}

        {/* Subtotal before VAT */}
        <div className="flex justify-between text-sm border-t border-border pt-2">
          <span className="text-muted-foreground">Subtotal (before VAT):</span>
          <span className="font-medium">{formatCurrency(subtotalBeforeVat)}</span>
        </div>

        {/* VAT */}
        {vatPercentage > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VAT ({vatPercentage}%):</span>
            <span className="font-medium">{formatCurrency(vatAmount)}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="flex justify-between text-lg font-bold border-t-2 border-primary/30 pt-3 mt-2">
          <span className="text-foreground">GRAND TOTAL:</span>
          <span className="text-primary">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
