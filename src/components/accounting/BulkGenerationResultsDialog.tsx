import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, DollarSign, AlertCircle } from "lucide-react";
import type { BulkGenerationResult } from "@/hooks/useBulkInvoiceGeneration";

interface BulkGenerationResultsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  results: BulkGenerationResult | null;
  onViewInvoices: () => void;
}

export const BulkGenerationResultsDialog: React.FC<BulkGenerationResultsDialogProps> = ({
  isOpen,
  onClose,
  results,
  onViewInvoices,
}) => {
  if (!results) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Invoice Generation Complete</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold text-green-600">{results.successCount}</p>
                    <p className="text-sm text-muted-foreground">Successfully Created</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-2xl font-bold text-red-600">{results.errorCount}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(results.totalAmount)}</p>
                    <p className="text-sm text-muted-foreground">Total Invoiced</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Success Message */}
          {results.successCount > 0 && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully generated {results.successCount} invoice{results.successCount !== 1 ? 's' : ''} 
                {results.totalAmount > 0 && ` totaling ${formatCurrency(results.totalAmount)}`}.
              </AlertDescription>
            </Alert>
          )}

          {/* Successful Invoices Table */}
          {results.invoices.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Generated Invoices</h3>
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Client</th>
                      <th className="text-left p-3 text-sm font-medium">Invoice #</th>
                      <th className="text-right p-3 text-sm font-medium">Amount</th>
                      <th className="text-center p-3 text-sm font-medium">Line Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.invoices.map((invoice) => (
                      <tr key={invoice.clientId} className="border-t">
                        <td className="p-3">{invoice.clientName}</td>
                        <td className="p-3 font-mono text-sm">{invoice.invoiceNumber}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(invoice.amount)}</td>
                        <td className="p-3 text-center">{invoice.lineItemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Errors */}
          {results.errors.length > 0 && (
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Failed to generate invoices for {results.errorCount} client{results.errorCount !== 1 ? 's' : ''}:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {results.errors.map((error, index) => (
                      <li key={index}>
                        <strong>{error.clientName}</strong> ({error.bookingCount} booking{error.bookingCount !== 1 ? 's' : ''}): {error.reason}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* No bookings message */}
          {results.message && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{results.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {results.successCount > 0 && (
            <Button onClick={() => {
              onViewInvoices();
              onClose();
            }}>
              View Generated Invoices
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
