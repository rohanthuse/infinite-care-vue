
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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { EnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { formatCurrency } from "@/utils/currencyFormatter";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  const { data: clientData } = useAdminClientDetail(invoice?.client_id || '');

  const handleDownload = () => {
    if (!invoice) return;
    
    const clientName = clientData ? 
      `${clientData.preferred_name || clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : 
      'Client';
    
    generateInvoicePDF({
      invoice,
      clientName,
      clientAddress: clientData?.address,
      clientEmail: clientData?.email,
      companyInfo: {
        name: 'Your Company Name',
        address: 'Company Address',
        phone: 'Company Phone',
        email: 'Company Email'
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!invoice) return null;

  const subtotal = invoice.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || invoice.amount;
  const totalDiscounts = invoice.line_items?.reduce((sum, item) => sum + item.discount_amount, 0) || 0;
  const taxPercentage = invoice.tax_amount || 0;
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal - totalDiscounts + taxAmount;

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
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Invoice Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice Date:</span>
                  <span>{format(new Date(invoice.invoice_date), 'dd/MM/yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span>{format(new Date(invoice.due_date), 'dd/MM/yyyy')}</span>
                </div>
                {invoice.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Date:</span>
                    <span>{format(new Date(invoice.paid_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}
                {invoice.service_provided_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Date:</span>
                    <span>{format(new Date(invoice.service_provided_date), 'dd/MM/yyyy')}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Amount Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Discounts:</span>
                    <span>-{formatCurrency(totalDiscounts)}</span>
                  </div>
                )}
                {taxPercentage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({taxPercentage}%):</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-700">{invoice.description}</p>
          </div>

          {/* Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Line Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</Table>
                      <TableCell>{formatCurrency(item.discount_amount)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(item.line_total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Payment History */}
          {invoice.payment_records && invoice.payment_records.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment History</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payment_records.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.payment_amount)}</TableCell>
                      <TableCell>{payment.transaction_id || '-'}</TableCell>
                      <TableCell>{payment.payment_reference || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
