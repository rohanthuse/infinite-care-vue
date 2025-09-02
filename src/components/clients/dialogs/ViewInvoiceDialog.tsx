
import React, { useState } from "react";
import { Eye, Download, Loader2 } from "lucide-react";
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
import { format, parseISO, isValid } from "date-fns";
import { EnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useToast } from "@/hooks/use-toast";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
}

const formatDateSafe = (dateValue: any): string => {
  if (!dateValue) return "N/A";
  
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(date)) return "N/A";
    return format(date, 'dd/MM/yyyy');
  } catch {
    return "N/A";
  }
};

export function ViewInvoiceDialog({ open, onOpenChange, invoice }: ViewInvoiceDialogProps) {
  const { data: clientData } = useAdminClientDetail(invoice?.client_id || '');
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleDownload = async () => {
    if (!invoice) {
      toast({
        title: "Error",
        description: "No invoice data available for download.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const clientName = clientData ? 
        `${clientData.preferred_name || clientData.first_name || ''} ${clientData.last_name || ''}`.trim() : 
        'Client';
      
      await generateInvoicePDF({
        invoice,
        clientName,
        clientAddress: clientData?.address || '',
        clientEmail: clientData?.email || '',
        companyInfo: {
          name: 'Care Service Provider',
          address: '123 Care Street, City, Country',
          phone: '+1 (555) 123-4567',
          email: 'billing@careservice.com'
        }
      });
      
      toast({
        title: "Success",
        description: `Invoice ${invoice.invoice_number} downloaded successfully.`,
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Unable to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case 'sent': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400';
      case 'pending': return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case 'overdue': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-red-500/10 text-red-700 dark:text-red-400';
      case 'refunded': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400';
      default: return 'bg-muted text-muted-foreground';
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isDownloading ? 'Generating...' : 'Download PDF'}
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
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice Date:</span>
                  <span className="text-foreground">{formatDateSafe(invoice.invoice_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="text-foreground">{formatDateSafe(invoice.due_date)}</span>
                </div>
                {invoice.paid_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paid Date:</span>
                    <span className="text-foreground">{formatDateSafe(invoice.paid_date)}</span>
                  </div>
                )}
                {invoice.service_provided_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Date:</span>
                    <span className="text-foreground">{formatDateSafe(invoice.service_provided_date)}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Amount Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">{formatCurrency(subtotal)}</span>
                </div>
                {totalDiscounts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Discounts:</span>
                    <span className="text-foreground">-{formatCurrency(totalDiscounts)}</span>
                  </div>
                )}
                {taxPercentage > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax ({taxPercentage}%):</span>
                    <span className="text-foreground">{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg border-t border-border pt-2">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-foreground">Description</h3>
            <p className="text-foreground">{invoice.description}</p>
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
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
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
                      <TableCell>{formatDateSafe(payment.payment_date)}</TableCell>
                      <TableCell className="capitalize">{payment.payment_method.replace('_', ' ')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(payment.payment_amount || 0)}</TableCell>
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
              <h3 className="text-lg font-semibold mb-2 text-foreground">Notes</h3>
              <p className="text-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
