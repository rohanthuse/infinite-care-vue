
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Download, CheckCircle, AlertCircle, Calendar, Plus, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useEnhancedClientBilling } from "@/hooks/useEnhancedClientBilling";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { format } from "date-fns";
import { AddPaymentDialog } from "@/components/clients/dialogs/AddPaymentDialog";
import { useToast } from "@/hooks/use-toast";
import { useSimpleClientAuth } from "@/hooks/useSimpleClientAuth";

const ClientPayments = () => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get authenticated client data from Supabase
  const { data: authData, isLoading: authLoading, error: authError } = useSimpleClientAuth();
  
  const clientId = authData?.client?.id;
  const clientName = `${authData?.client?.first_name || ''} ${authData?.client?.last_name || ''}`.trim();
  const clientEmail = authData?.user?.email;

  const { data: invoices, isLoading: billingLoading, error: billingError } = useEnhancedClientBilling(clientId || '');

  // Calculate totals for summary
  const pendingInvoices = invoices?.filter(inv => inv.status === 'pending' || inv.status === 'sent') || [];
  const totalPending = pendingInvoices.reduce((sum, inv) => sum + (inv.total_amount || inv.amount), 0);

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <div className="flex items-center text-green-600">
            <CheckCircle className="h-4 w-4 mr-1" />
            <span>Paid</span>
          </div>
        );
      case "pending":
      case "sent":
        return (
          <div className="flex items-center text-yellow-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Pending</span>
          </div>
        );
      case "overdue":
        return (
          <div className="flex items-center text-red-600">
            <AlertCircle className="h-4 w-4 mr-1" />
            <span>Overdue</span>
          </div>
        );
      default:
        return null;
    }
  };

  const handleDownloadInvoice = (invoice: any) => {
    try {
      generateInvoicePDF({
        invoice,
        clientName: clientName || "Client",
        clientAddress: "", // Address not available in current auth data
        clientEmail: clientEmail || "",
        companyInfo: {
          name: "Care Service Provider",
          address: "123 Care Street, City, Country",
          phone: "+1 (555) 123-4567",
          email: "billing@careservice.com"
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

  const calculateRemainingBalance = (invoice: any) => {
    const total = invoice.total_amount || invoice.amount;
    const paid = invoice.payment_records?.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0) || 0;
    return Math.max(0, total - paid);
  };

  // Handle loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Handle auth errors
  if (authError || !clientId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-500">Please log in to view your payments and billing information.</p>
        </div>
      </div>
    );
  }

  if (billingLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your billing information...</p>
        </div>
      </div>
    );
  }

  if (billingError) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading billing information</h3>
        <p className="text-gray-600">Unable to load your billing data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold mb-6">Payments & Billing</h2>
        
        <Tabs defaultValue="invoices" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b pb-4">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Invoices Tab */}
          <TabsContent value="invoices" className="pt-6 space-y-4">
            {/* Summary Cards */}
            {pendingInvoices.length > 0 && (
              <Card className="mb-6 bg-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <h3 className="font-medium text-blue-900 mb-2">Outstanding Balance</h3>
                  <p className="text-2xl font-bold text-blue-900 mb-2">{formatCurrency(totalPending)}</p>
                  <p className="text-blue-700 text-sm mb-4">
                    You have {pendingInvoices.length} pending {pendingInvoices.length === 1 ? 'invoice' : 'invoices'}.
                  </p>
                  <Button onClick={() => {
                    // Handle pay all functionality
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
            
            {/* Invoices List */}
            <div className="space-y-4">
              {invoices && invoices.length > 0 ? invoices.map(invoice => {
                const remainingBalance = calculateRemainingBalance(invoice);
                const isPaid = invoice.status === 'paid' || remainingBalance <= 0;
                
                return (
                  <div key={invoice.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center">
                          <h4 className="font-medium">{invoice.invoice_number}</h4>
                          <span className="mx-2 text-gray-400">•</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                      </div>
                      <div className="text-lg font-bold">
                        {formatCurrency(invoice.total_amount || invoice.amount)}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-500">Invoice Date:</span> {format(new Date(invoice.invoice_date), 'MMM d, yyyy')}
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-500">Due Date:</span> {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                          </div>
                          {invoice.service_provided_date && (
                            <div className="text-sm">
                              <span className="text-gray-500">Service Date:</span> {format(new Date(invoice.service_provided_date), 'MMM d, yyyy')}
                            </div>
                          )}
                          {isPaid && invoice.paid_date && (
                            <div className="text-sm">
                              <span className="text-gray-500">Paid Date:</span> {format(new Date(invoice.paid_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {invoice.payment_records && invoice.payment_records.length > 0 && (
                            <>
                              <div className="text-sm">
                                <span className="text-gray-500">Amount Paid:</span> {formatCurrency(
                                  invoice.payment_records.reduce((sum: number, payment: any) => sum + payment.payment_amount, 0)
                                )}
                              </div>
                              {remainingBalance > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-500">Remaining Balance:</span> 
                                  <span className="font-medium text-red-600 ml-1">{formatCurrency(remainingBalance)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Line Items */}
                      {invoice.line_items && invoice.line_items.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Services Provided:</h5>
                          <div className="bg-gray-50 rounded p-3 space-y-1">
                            {invoice.line_items.map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.description} (x{item.quantity})</span>
                                <span>{formatCurrency(item.line_total)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Payment History */}
                      {invoice.payment_records && invoice.payment_records.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Payment History:</h5>
                          <div className="bg-green-50 rounded p-3 space-y-1">
                            {invoice.payment_records.map((payment: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{format(new Date(payment.payment_date), 'MMM d, yyyy')} - {payment.payment_method}</span>
                                <span className="text-green-600 font-medium">{formatCurrency(payment.payment_amount)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2 pt-2">
                        {!isPaid && remainingBalance > 0 && (
                          <Button onClick={() => handlePayInvoice(invoice)}>
                            Pay {remainingBalance < (invoice.total_amount || invoice.amount) ? 'Balance' : 'Now'}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          title="Download Invoice"
                          onClick={() => handleDownloadInvoice(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
                  <p className="text-gray-600">Your billing history will appear here once you start receiving services.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Payment Methods Tab */}
          <TabsContent value="payment-methods" className="pt-6">
            <div className="space-y-6">
              <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Methods</h3>
                <p className="text-gray-500 mb-4">
                  Payment method management will be available soon. For now, you can pay invoices individually.
                </p>
                <Button disabled>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
              
              <Separator className="my-6" />
              
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Billing Information</h3>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{clientName || "Client Name"}</p>
                        <p className="text-gray-600">Address not available</p>
                        <p className="text-gray-600">{clientEmail || "Email not available"}</p>
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
