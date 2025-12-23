
import React, { useState } from "react";
import { Eye, Download, Loader2, FileText, Receipt, Timer, Pencil } from "lucide-react";
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
import { generateInvoicePDF, InvoiceExpenseEntryForPdf, InvoiceExtraTimeEntryForPdf, InvoiceCancelledBookingForPdf } from "@/utils/invoicePdfGenerator";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useToast } from "@/hooks/use-toast";
import { InvoiceLedgerView } from "@/components/accounting/InvoiceLedgerView";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceCancelledBookingsSection } from "./InvoiceCancelledBookingsSection";
import { useInvoiceExpenseEntries } from "@/hooks/useInvoiceExpenses";
import { useInvoiceExtraTimeEntries, calculateExtraTimeTotals } from "@/hooks/useInvoiceExtraTimeEntries";
import { useInvoiceCancelledBookings } from "@/hooks/useInvoiceCancelledBookings";
import { Calculator } from "lucide-react";

interface ViewInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: EnhancedClientBilling | null;
  onEditInvoice?: (invoiceId: string) => void;
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

export function ViewInvoiceDialog({ open, onOpenChange, invoice, onEditInvoice }: ViewInvoiceDialogProps) {
  const { data: clientData } = useAdminClientDetail(invoice?.client_id || '');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showLedgerView, setShowLedgerView] = useState(false);
  const { toast } = useToast();

  // Fetch expense, extra time, and cancelled booking entries for this invoice
  const { data: expenseEntries = [] } = useInvoiceExpenseEntries(invoice?.id);
  const { data: extraTimeEntries = [] } = useInvoiceExtraTimeEntries(invoice?.id);
  const { data: cancelledBookings = [] } = useInvoiceCancelledBookings(invoice?.id);

  // Calculate expense totals
  const expensesTotal = expenseEntries.reduce((sum, e) => sum + (e.amount || 0), 0);
  const extraTimeTotals = calculateExtraTimeTotals(extraTimeEntries);
  
  // Calculate cancelled booking fees (staff payment amounts for cancelled bookings)
  const cancelledBookingFees = cancelledBookings.reduce((sum, b) => {
    if (b.suspension_honor_staff_payment && b.staff_payment_amount) {
      return sum + b.staff_payment_amount;
    }
    return sum;
  }, 0);

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
      
      // Fetch organization details via branch
      let orgData = null;
      if (clientData?.branch_id) {
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('organization_id')
          .eq('id', clientData.branch_id)
          .maybeSingle();
        
        if (!branchError && branchData?.organization_id) {
          const { data, error: orgError } = await supabase
            .from('organizations')
            .select('name, address, contact_email, contact_phone')
            .eq('id', branchData.organization_id)
            .maybeSingle();
          
          if (!orgError) {
            orgData = data;
          }
        }
      }

      // Prepare expense entries for PDF
      const pdfExpenseEntries: InvoiceExpenseEntryForPdf[] = expenseEntries.map(e => ({
        id: e.id,
        expense_type_name: e.expense_type_name || 'Expense',
        date: e.date,
        amount: e.amount || 0,
        description: e.description,
        staff_name: e.staff_name,
        booking_reference: null,
      }));

      // Prepare extra time entries for PDF
      const pdfExtraTimeEntries: InvoiceExtraTimeEntryForPdf[] = extraTimeEntries.map(e => ({
        id: e.id,
        work_date: e.work_date,
        extra_time_minutes: e.extra_time_minutes,
        total_cost: e.total_cost,
        reason: e.reason,
        staff_name: e.staff_name,
        booking_id: e.booking_id,
      }));

      // Prepare cancelled bookings for PDF
      const pdfCancelledBookings: InvoiceCancelledBookingForPdf[] = cancelledBookings
        .filter(b => b.suspension_honor_staff_payment && b.staff_payment_amount)
        .map(b => ({
          id: b.id,
          start_time: b.start_time,
          cancellation_reason: b.cancellation_reason,
          staff_name: b.staff_first_name && b.staff_last_name 
            ? `${b.staff_first_name} ${b.staff_last_name}` 
            : null,
          staff_payment_amount: b.staff_payment_amount,
        }));

      await generateInvoicePDF({
        invoice,
        clientName,
        clientAddress: clientData?.address || '',
        clientEmail: clientData?.email || '',
        clientPhone: clientData?.phone || '',
        organizationInfo: {
          name: orgData?.name || 'Care Service Provider',
          address: orgData?.address || 'Organisation Address',
          email: orgData?.contact_email || 'contact@organisation.com',
          phone: orgData?.contact_phone
        },
        expenseEntries: pdfExpenseEntries,
        extraTimeEntries: pdfExtraTimeEntries,
        cancelledBookings: pdfCancelledBookings,
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

  // Check if this is a ledger-based invoice
  const isLedgerInvoice = invoice.invoice_type === 'ledger_based' || 
                         invoice.start_date || 
                         invoice.end_date ||
                         invoice.total_invoiced_hours_minutes;

  if (showLedgerView && invoice && isLedgerInvoice) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowLedgerView(false)}
                  size="sm"
                >
                  ← Back to Summary
                </Button>
                <span>Invoice #{invoice.invoice_number} - Ledger View</span>
              </div>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                {isDownloading ? "Downloading..." : "Download PDF"}
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <InvoiceLedgerView 
            invoiceId={invoice.id} 
            onClose={() => onOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  const subtotal = invoice.line_items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || invoice.amount;
  const totalDiscounts = invoice.line_items?.reduce((sum, item) => sum + item.discount_amount, 0) || 0;
  const taxPercentage = invoice.tax_amount || 0;
  const taxAmount = subtotal * (taxPercentage / 100);
  const total = subtotal - totalDiscounts + taxAmount;

  // Calculate totals for line items summary
  const subtotalBeforeVat = invoice.line_items?.reduce(
    (sum, item) => sum + (item.line_total || 0), 
    0
  ) || 0;

  // Use actual stored VAT amounts if available, otherwise calculate based on is_vatable flag
  const totalVatAmount = invoice.line_items?.reduce(
    (sum, item) => {
      // Use stored vat_amount if available, otherwise calculate only if is_vatable
      const itemVat = (item as any).vat_amount ?? 
                      ((item as any).is_vatable ? (item.line_total || 0) * 0.20 : 0);
      return sum + itemVat;
    }, 
    0
  ) || invoice.vat_amount || 0;

  const grandTotal = subtotalBeforeVat + totalVatAmount;

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
            <div className="flex items-center gap-2">
              {/* Edit Invoice button - only for editable statuses and not locked */}
              {onEditInvoice && 
               !invoice.is_locked && 
               ['draft', 'ready_to_charge', 'pending'].includes(invoice.status) && (
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    onEditInvoice(invoice.id);
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Invoice
                </Button>
              )}
              {isLedgerInvoice && (
                <Button
                  onClick={() => setShowLedgerView(true)}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Ledger
                </Button>
              )}
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
                  <Badge variant="custom" className={getStatusColor(invoice.status)}>
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
                {/* Booked Time - only for booking-based invoices */}
                {invoice.generated_from_booking ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked Time:</span>
                    <span className="text-foreground">
                      {invoice.booked_time_minutes && invoice.booked_time_minutes > 0 
                        ? `${Math.floor(invoice.booked_time_minutes / 60)}h ${invoice.booked_time_minutes % 60}m`
                        : '-'}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked Time:</span>
                    <span className="text-muted-foreground">N/A (Manual Invoice)</span>
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
                    <TableHead>Data</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Price/Rate(£)</TableHead>
                    <TableHead>VAT(£)</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {invoice.line_items.map((item) => {
                    // Use stored VAT if available, otherwise calculate based on is_vatable flag
                    const lineVat = (item as any).vat_amount ?? 
                                    ((item as any).is_vatable ? (item.line_total || 0) * 0.20 : 0);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.quantity || 1}</TableCell>
                        <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                        <TableCell>{formatCurrency(lineVat)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(item.line_total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Line Items Subtotal */}
              <div className="mt-3 flex justify-end">
                <div className="text-sm">
                  <span className="text-muted-foreground">Line Items Subtotal:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(subtotalBeforeVat)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Expenses Section */}
          {expenseEntries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-amber-600" />
                Additional Expenses
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseEntries.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.date ? formatDateSafe(expense.date) : '-'}</TableCell>
                      <TableCell>{expense.expense_type_name || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{expense.description || '-'}</TableCell>
                      <TableCell>{expense.staff_name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex justify-end">
                <div className="text-sm">
                  <span className="text-muted-foreground">Expenses Subtotal:</span>
                  <span className="ml-2 font-semibold">{formatCurrency(expensesTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Extra Time Charges Section */}
          {extraTimeEntries.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Timer className="h-5 w-5 text-blue-600" />
                Extra Time Charges
              </h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extraTimeEntries.map((record) => {
                    const hours = Math.floor(record.extra_time_minutes / 60);
                    const mins = record.extra_time_minutes % 60;
                    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                    
                    return (
                      <TableRow key={record.id}>
                        <TableCell>{formatDateSafe(record.work_date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{durationStr}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{record.reason || '-'}</TableCell>
                        <TableCell>{record.staff_name || '-'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(record.total_cost)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-3 flex justify-end">
                <div className="text-sm">
                  <span className="text-muted-foreground">Extra Time Subtotal ({extraTimeTotals.formattedTime}):</span>
                  <span className="ml-2 font-semibold">{formatCurrency(extraTimeTotals.totalCost)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cancelled Bookings Section */}
          <InvoiceCancelledBookingsSection invoiceId={invoice.id} />

          {/* Comprehensive Invoice Total Summary - AFTER Cancelled Bookings */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Invoice Total Summary
            </h3>
            <div className="space-y-3">
              {/* Service Charges (Line Items) */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service Charges (Line Items):</span>
                <span className="font-medium">{formatCurrency(subtotalBeforeVat)}</span>
              </div>
              
              {/* Additional Expenses */}
              {expensesTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Additional Expenses:</span>
                  <span className="font-medium">{formatCurrency(expensesTotal)}</span>
                </div>
              )}
              
              {/* Extra Time Charges */}
              {extraTimeTotals.totalCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extra Time Charges ({extraTimeTotals.formattedTime}):</span>
                  <span className="font-medium">{formatCurrency(extraTimeTotals.totalCost)}</span>
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
                <span className="font-medium">
                  {formatCurrency(subtotalBeforeVat + expensesTotal + extraTimeTotals.totalCost + cancelledBookingFees)}
                </span>
              </div>
              
              {/* VAT */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (20%):</span>
                <span className="font-medium">{formatCurrency(totalVatAmount)}</span>
              </div>
              
              {/* Grand Total */}
              <div className="flex justify-between text-lg font-bold border-t-2 border-primary/30 pt-3 mt-2">
                <span className="text-foreground">GRAND TOTAL:</span>
                <span className="text-primary">
                  {formatCurrency(subtotalBeforeVat + expensesTotal + extraTimeTotals.totalCost + cancelledBookingFees + totalVatAmount)}
                </span>
              </div>
            </div>
          </div>

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
