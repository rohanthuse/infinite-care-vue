
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Download, CheckCircle, AlertCircle, Calendar, Plus, Loader2, Clock, Car, Receipt, XCircle, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useClientPortalInvoices, getInvoiceDisplayStatus } from "@/hooks/useClientPortalInvoices";
import { useClientInvoiceExpenses } from "@/hooks/useClientInvoiceExpenses";
import { useClientInvoiceExtraTime, formatDuration } from "@/hooks/useClientInvoiceExtraTime";
import { useClientInvoiceCancelledBookings } from "@/hooks/useClientInvoiceCancelledBookings";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { format } from "date-fns";
import { AddPaymentDialog } from "@/components/clients/dialogs/AddPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Component to display expenses for an invoice
const InvoiceExpensesSection: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const { data: expenses, isLoading } = useClientInvoiceExpenses(invoiceId);

  if (isLoading) return null;
  if (!expenses || expenses.length === 0) return null;

  const travelExpenses = expenses.filter(e => e.category === 'travel' || e.category === 'mileage');
  const otherExpenses = expenses.filter(e => e.category === 'other');

  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <Receipt className="h-4 w-4" />
        Expenses Breakdown
      </h5>
      <div className="bg-muted/50 rounded-lg p-3 space-y-3">
        {travelExpenses.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Car className="h-3 w-3" />
              Travel & Mileage
            </div>
            <div className="space-y-1">
              {travelExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{expense.description}</span>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {otherExpenses.length > 0 && (
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-1">Other Expenses</div>
            <div className="space-y-1">
              {otherExpenses.map((expense) => (
                <div key={expense.id} className="flex justify-between text-sm">
                  <span className="text-foreground">{expense.description}</span>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component to display extra time for an invoice
const InvoiceExtraTimeSection: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const { data: extraTimeItems, isLoading } = useClientInvoiceExtraTime(invoiceId);

  if (isLoading) return null;
  if (!extraTimeItems || extraTimeItems.length === 0) return null;

  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Extra Time Details
      </h5>
      <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 space-y-1 border border-amber-200 dark:border-amber-800">
        {extraTimeItems.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <div>
              <span className="text-foreground">{item.description}</span>
              <span className="text-muted-foreground ml-2">
                ({formatDuration(item.duration_minutes)} @ {formatCurrency(item.rate_per_hour)}/hr)
              </span>
            </div>
            <span className="font-medium">{formatCurrency(item.total_cost)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Component to display cancelled bookings with charges for an invoice
const InvoiceCancelledBookingsSection: React.FC<{ invoiceId: string }> = ({ invoiceId }) => {
  const { data: cancelledBookings, isLoading } = useClientInvoiceCancelledBookings(invoiceId);

  if (isLoading) return null;
  if (!cancelledBookings || cancelledBookings.length === 0) return null;

  return (
    <div className="mb-4">
      <h5 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
        <XCircle className="h-4 w-4" />
        Cancelled Appointments (Charges Apply)
      </h5>
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
        <p className="text-xs text-amber-700 dark:text-amber-400">
          The following appointments were cancelled. Charges apply as per your service agreement.
        </p>
        {cancelledBookings.map((booking) => (
          <div key={booking.id} className="flex justify-between text-sm border-t border-amber-200 dark:border-amber-800 pt-2">
            <div>
              <span className="font-medium text-foreground">
                {format(new Date(booking.start_time), 'MMM d, yyyy')} at {format(new Date(booking.start_time), 'HH:mm')}
              </span>
              {booking.service_title && (
                <span className="text-muted-foreground ml-2">({booking.service_title})</span>
              )}
            </div>
            {booking.staff_payment_amount && (
              <span className="font-medium text-amber-800 dark:text-amber-300">{formatCurrency(booking.staff_payment_amount)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Status badge component
const InvoiceStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "paid":
      return (
        <Badge variant="custom" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case "pending":
    case "sent":
      return (
        <Badge variant="custom" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "overdue":
      return (
        <Badge variant="custom" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-3 w-3 mr-1" />
          Overdue
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status}
        </Badge>
      );
  }
};

// Invoice Row Component with proper table structure
const InvoiceRow: React.FC<{
  invoice: any;
  clientName: string;
  clientEmail: string;
  onPayInvoice: (invoice: any) => void;
  onDownloadInvoice: (invoice: any) => void;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ invoice, clientName, clientEmail, onPayInvoice, onDownloadInvoice, isExpanded, onToggle }) => {
  const displayStatus = getInvoiceDisplayStatus(invoice);
  const remainingBalance = (() => {
    const total = invoice.total_amount || invoice.amount;
    const paid = invoice.payment_records?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
    return Math.max(0, total - paid);
  })();
  const isPaid = displayStatus === 'paid' || remainingBalance <= 0;

  return (
    <>
      {/* Main Invoice Row */}
      <TableRow 
        className="hover:bg-muted/50 cursor-pointer border-b" 
        onClick={onToggle}
      >
        {/* Invoice Number */}
        <TableCell className="font-medium py-4 w-[130px]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">{invoice.invoice_number}</span>
          </div>
        </TableCell>
        
        {/* Invoice Date - Always visible */}
        <TableCell className="py-4 w-[110px]">
          <span className="text-foreground">
            {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
          </span>
        </TableCell>
        
        {/* Due Date - Always visible */}
        <TableCell className="py-4 w-[110px]">
          <span className={displayStatus === 'overdue' ? 'text-destructive font-medium' : 'text-foreground'}>
            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
          </span>
        </TableCell>
        
        {/* Amount - Right aligned */}
        <TableCell className="py-4 w-[100px] text-right font-semibold text-foreground">
          {formatCurrency(invoice.total_amount || invoice.amount)}
        </TableCell>
        
        {/* Status Badge */}
        <TableCell className="py-4 w-[100px]">
          <InvoiceStatusBadge status={displayStatus} />
        </TableCell>
        
        {/* Actions */}
        <TableCell className="py-4 w-[160px]">
          <div className="flex items-center justify-end gap-1">
            {!isPaid && remainingBalance > 0 && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onPayInvoice(invoice);
                }}
                className="h-8 text-xs"
              >
                Pay Now
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadInvoice(invoice);
              }}
              title="Download Invoice"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TableCell>
      </TableRow>

      {/* Expanded Details Row */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="p-0 border-b-2 border-border">
            <div className="bg-muted/30 p-5 border-t border-border">
              {/* Invoice Details Header */}
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="font-semibold text-foreground">Invoice Details</h4>
              </div>

              {/* Invoice Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-5">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{invoice.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Invoice Date</span>
                      <span className="font-medium text-foreground">{format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Due Date</span>
                      <span className={`font-medium ${displayStatus === 'overdue' ? 'text-destructive' : 'text-foreground'}`}>
                        {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {invoice.service_provided_date && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Service Date</span>
                      <span className="font-medium text-foreground">{format(new Date(invoice.service_provided_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {invoice.start_date && invoice.end_date && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Service Period</span>
                      <span className="font-medium text-foreground">
                        {format(new Date(invoice.start_date), 'MMM d')} - {format(new Date(invoice.end_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {invoice.payment_records && invoice.payment_records.length > 0 && (
                    <>
                      <div className="text-sm">
                        <span className="text-muted-foreground block text-xs uppercase tracking-wide">Amount Paid</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(
                            invoice.payment_records.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0)
                          )}
                        </span>
                      </div>
                      {remainingBalance > 0 && (
                        <div className="text-sm">
                          <span className="text-muted-foreground block text-xs uppercase tracking-wide">Remaining Balance</span>
                          <span className="font-semibold text-destructive">{formatCurrency(remainingBalance)}</span>
                        </div>
                      )}
                    </>
                  )}
                  {isPaid && invoice.paid_date && (
                    <div className="text-sm">
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Paid Date</span>
                      <span className="font-medium text-green-600 dark:text-green-400">{format(new Date(invoice.paid_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items / Services */}
              {invoice.line_items && invoice.line_items.length > 0 && (
                <div className="mb-5">
                  <h5 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Services Provided
                  </h5>
                  <div className="bg-background rounded-lg border p-4 space-y-2">
                    {invoice.line_items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-foreground">{item.description} (x{item.quantity})</span>
                        <span className="font-medium text-foreground">{formatCurrency(item.line_total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses Section */}
              <InvoiceExpensesSection invoiceId={invoice.id} />

              {/* Extra Time Section */}
              <InvoiceExtraTimeSection invoiceId={invoice.id} />

              {/* Cancelled Bookings Section */}
              <InvoiceCancelledBookingsSection invoiceId={invoice.id} />

              {/* Tax & Total Summary */}
              {(invoice.tax_amount || invoice.vat_amount || invoice.net_amount) && (
                <div className="mb-5 bg-background rounded-lg border p-4">
                  <h5 className="text-sm font-semibold text-foreground mb-3">Payment Summary</h5>
                  <div className="space-y-2 text-sm">
                    {invoice.net_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="text-foreground">{formatCurrency(invoice.net_amount)}</span>
                      </div>
                    )}
                    {invoice.tax_amount && invoice.tax_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span className="text-foreground">{formatCurrency(invoice.tax_amount)}</span>
                      </div>
                    )}
                    {invoice.vat_amount && invoice.vat_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">VAT:</span>
                        <span className="text-foreground">{formatCurrency(invoice.vat_amount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-semibold text-base">
                      <span className="text-foreground">Total:</span>
                      <span className="text-foreground">{formatCurrency(invoice.total_amount || invoice.amount)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History */}
              {invoice.payment_records && invoice.payment_records.length > 0 && (
                <div className="mb-5">
                  <h5 className="text-sm font-semibold text-foreground mb-3">Payment History</h5>
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800 p-4 space-y-2">
                    {invoice.payment_records.map((payment: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {format(new Date(payment.payment_date), 'MMM d, yyyy')} - {payment.payment_method}
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(payment.payment_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                {!isPaid && remainingBalance > 0 && (
                  <Button onClick={() => onPayInvoice(invoice)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {remainingBalance < (invoice.total_amount || invoice.amount) ? 'Pay Balance' : 'Pay Now'}
                  </Button>
                )}
                <Button variant="outline" onClick={() => onDownloadInvoice(invoice)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const ClientPayments = () => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get authenticated client data from Supabase
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  
  const clientId = authData?.client?.id;
  const clientName = `${authData?.client?.first_name || ''} ${authData?.client?.last_name || ''}`.trim();
  const clientEmail = authData?.user?.email;

  const { data: invoices, isLoading: billingLoading, error: billingError } = useClientPortalInvoices(clientId || '');

  // Check for deep-link to specific invoice from notification
  useEffect(() => {
    const openInvoiceId = sessionStorage.getItem('openInvoiceId');
    if (openInvoiceId && invoices) {
      const invoiceExists = invoices.some(inv => inv.id === openInvoiceId);
      if (invoiceExists) {
        setExpandedInvoiceId(openInvoiceId);
        sessionStorage.removeItem('openInvoiceId');
      }
    }
  }, [invoices]);

  // Calculate totals for summary - include overdue invoices
  const pendingInvoices = invoices?.filter(inv => {
    const displayStatus = getInvoiceDisplayStatus(inv);
    return displayStatus === 'pending' || displayStatus === 'sent' || displayStatus === 'overdue';
  }) || [];
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || inv.amount), 0);

  const handleDownloadInvoice = async (invoice: any) => {
    try {
      // Fetch organization details if possible
      let orgData = null;
      if (invoice.organization_id) {
        const { data, error: orgError } = await supabase
          .from('organizations')
          .select('name, address, contact_email, contact_phone, logo_url')
          .eq('id', invoice.organization_id)
          .maybeSingle();
        
        if (!orgError) {
          orgData = data;
        }
      }

      // Convert logo URL to base64 for PDF
      let logoBase64: string | null = null;
      if (orgData?.logo_url) {
        try {
          const response = await fetch(orgData.logo_url);
          if (response.ok) {
            const blob = await response.blob();
            logoBase64 = await new Promise<string | null>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          }
        } catch (error) {
          console.error('Error loading organization logo:', error);
        }
      }

      generateInvoicePDF({
        invoice,
        clientName: clientName || "Client",
        clientAddress: "",
        clientEmail: clientEmail || "",
        clientPhone: "",
        organizationInfo: {
          name: orgData?.name || "Care Service Provider",
          address: orgData?.address || "Organization Address",
          email: orgData?.contact_email || "contact@organization.com",
          phone: orgData?.contact_phone,
          logoBase64: logoBase64
        }
      });
      toast({
        title: "Invoice Downloaded",
        description: `Invoice ${invoice.invoice_number} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePayInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  // Handle loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Handle auth errors
  if (authError || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Authentication Required</h3>
          <p className="text-muted-foreground">Please log in to view your payments and billing information.</p>
        </div>
      </div>
    );
  }

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your billing information...</p>
        </div>
      </div>
    );
  }

  if (billingError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Error loading billing information</h3>
        <p className="text-muted-foreground">Unable to load your billing data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl border border-border">
        <h2 className="text-xl font-bold mb-6 text-foreground">Payments & Billing</h2>
        
        <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border pb-4">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices" className="pt-6 space-y-4">
            {/* Summary Cards */}
            {pendingInvoices.length > 0 && (
              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-medium text-primary mb-2">Outstanding Balance</h3>
                  <p className="text-2xl font-bold text-primary mb-2">{formatCurrency(totalPending)}</p>
                  <p className="text-primary/80 text-sm mb-4">
                    You have {pendingInvoices.length} pending {pendingInvoices.length === 1 ? 'invoice' : 'invoices'}.
                  </p>
                  <Button onClick={() => {
                    toast({
                      title: "Feature Coming Soon",
                      description: "Bulk payment functionality will be available soon.",
                    });
                  }}>
                    Pay All Outstanding
                  </Button>
                </CardContent>
              </Card>
            )}
            
            {/* Invoices Table */}
            {invoices && invoices.length > 0 ? (
              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[130px]">Invoice No</TableHead>
                      <TableHead className="font-semibold w-[110px]">Invoice Date</TableHead>
                      <TableHead className="font-semibold w-[110px]">Due Date</TableHead>
                      <TableHead className="font-semibold w-[100px] text-right">Amount</TableHead>
                      <TableHead className="font-semibold w-[100px]">Status</TableHead>
                      <TableHead className="font-semibold w-[160px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map(invoice => (
                      <InvoiceRow
                        key={invoice.id}
                        invoice={invoice}
                        clientName={clientName || ""}
                        clientEmail={clientEmail || ""}
                        onPayInvoice={handlePayInvoice}
                        onDownloadInvoice={handleDownloadInvoice}
                        isExpanded={expandedInvoiceId === invoice.id}
                        onToggle={() => setExpandedInvoiceId(
                          expandedInvoiceId === invoice.id ? null : invoice.id
                        )}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No invoices yet</h3>
                <p className="text-muted-foreground">Your billing history will appear here once you start receiving services.</p>
              </div>
            )}
          </TabsContent>
          
          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="pt-6">
            <div className="space-y-6">
              <div className="text-center p-8 border border-dashed border-border rounded-lg">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Payment Methods</h3>
                <p className="text-muted-foreground mb-4">
                  Payment method management will be available soon. For now, you can pay invoices individually.
                </p>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
              
              <Separator className="my-6" />
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-foreground">Billing Information</h3>
                <div className="border border-border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-foreground">{clientName || "Client Name"}</p>
                      <p className="text-muted-foreground">Address not available</p>
                      <p className="text-muted-foreground">{clientEmail || "Email not available"}</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Payment Dialog */}
      <AddPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default ClientPayments;
