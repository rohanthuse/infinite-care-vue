import React, { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { 
  CreditCard, Clock, Plus, PoundSterling, AlertTriangle, 
  Eye, Edit, Send, Check, X, FileText, Download 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateEnhancedInvoiceDialog } from "../dialogs/CreateEnhancedInvoiceDialog";
import { EditInvoiceDialog } from "../dialogs/EditInvoiceDialog";
import { AddPaymentDialog } from "../dialogs/AddPaymentDialog";
import { ViewInvoiceDialog } from "../dialogs/ViewInvoiceDialog";
import { UninvoicedServicesAlert } from "../alerts/UninvoicedServicesAlert";
import { generateInvoicePDF } from "@/utils/invoicePdfGenerator";
import { formatCurrency } from "@/utils/currencyFormatter";
import { 
  useEnhancedClientBilling, 
  useUninvoicedBookings, 
  useUpdateInvoiceStatus,
  EnhancedClientBilling 
} from "@/hooks/useEnhancedClientBilling";
import { useAdminClientDetail } from "@/hooks/useAdminClientData";
import { supabase } from "@/integrations/supabase/client";
import { SuspensionAlertBanner } from "../SuspensionAlertBanner";

interface EnhancedBillingTabProps {
  clientId: string;
  branchId?: string;
}

export const EnhancedBillingTab: React.FC<EnhancedBillingTabProps> = ({ clientId, branchId }) => {
  const [activeTab, setActiveTab] = useState("invoices");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedClientBilling | null>(null);

  // Safe date formatter to handle invalid dates
  const formatDateSafe = (dateInput: string | Date | null | undefined, formatString: string = 'dd/MM/yyyy'): string => {
    if (!dateInput) return 'N/A';
    try {
      const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
      if (!isValid(date)) return 'N/A';
      return format(date, formatString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  const { data: billingItems = [], isLoading } = useEnhancedClientBilling(clientId);
  const { data: uninvoicedBookings = [] } = useUninvoicedBookings(branchId);
  const { data: clientData } = useAdminClientDetail(clientId);
  const updateStatusMutation = useUpdateInvoiceStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'draft': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'refunded': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <Check className="h-3 w-3" />;
      case 'overdue': return <AlertTriangle className="h-3 w-3" />;
      case 'draft': return <Edit className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ 
        id: invoiceId, 
        status: newStatus 
      });
    } catch (error) {
      console.error('Failed to update invoice status:', error);
    }
  };

  const handleViewInvoice = (invoice: EnhancedClientBilling) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleEditInvoice = (invoice: EnhancedClientBilling) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  };

  const handleAddPayment = (invoice: EnhancedClientBilling) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  const handleDownloadInvoice = async (invoice: EnhancedClientBilling) => {
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
          .select('name, address, contact_email, contact_phone, logo_url')
          .eq('id', branchData.organization_id)
          .maybeSingle();
        
        if (!orgError) {
          orgData = data;
        }
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
      clientName,
      clientAddress: clientData?.address,
      clientEmail: clientData?.email,
      clientPhone: clientData?.phone,
      organizationInfo: {
        name: orgData?.name || 'Care Service Provider',
        address: orgData?.address || 'Organisation Address',
        email: orgData?.contact_email || 'contact@organisation.com',
        phone: orgData?.contact_phone,
        logoBase64: logoBase64
      }
    });
  };

  const calculateTotalOutstanding = () => {
    return billingItems
      .filter(item => item.status !== 'paid' && item.status !== 'cancelled')
      .reduce((sum, item) => {
        const subtotal = item.line_items?.reduce((lineSum, lineItem) => 
          lineSum + ((lineItem.quantity || 0) * (lineItem.unit_price || 0)), 0) || (item.amount || 0);
        const discounts = item.line_items?.reduce((discSum, lineItem) => 
          discSum + (lineItem.discount_amount || 0), 0) || 0;
        const taxAmount = subtotal * ((item.tax_amount || 0) / 100);
        return sum + (subtotal - discounts + taxAmount);
      }, 0);
  };

  const calculateTotalPaid = () => {
    return billingItems
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => {
        const subtotal = item.line_items?.reduce((lineSum, lineItem) => 
          lineSum + ((lineItem.quantity || 0) * (lineItem.unit_price || 0)), 0) || (item.amount || 0);
        const discounts = item.line_items?.reduce((discSum, lineItem) => 
          discSum + (lineItem.discount_amount || 0), 0) || 0;
        const taxAmount = subtotal * ((item.tax_amount || 0) / 100);
        return sum + (subtotal - discounts + taxAmount);
      }, 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SuspensionAlertBanner clientId={clientId} />
      
      {/* Uninvoiced Services Alert */}
      {uninvoicedBookings.length > 0 && (
        <UninvoicedServicesAlert 
          uninvoicedBookings={uninvoicedBookings.filter(booking => booking.client_id === clientId)} 
          onCreateInvoice={() => setIsCreateDialogOpen(true)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(calculateTotalOutstanding())}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalPaid())}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Invoices</p>
                <p className="text-2xl font-bold text-blue-600">{billingItems.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Invoices from Bookings</CardTitle>
          </div>
          <CardDescription>View all invoices generated from completed bookings</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="invoices" className="space-y-4">
              {billingItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-sm font-medium">No booking-linked invoices yet</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Invoices will appear here automatically when bookings are completed and invoiced
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingItems.map((invoice) => {
                    const subtotal = invoice.line_items?.reduce((sum, item) => 
                      sum + ((item.quantity || 0) * (item.unit_price || 0)), 0) || (invoice.amount || 0);
                    const discounts = invoice.line_items?.reduce((sum, item) => 
                      sum + (item.discount_amount || 0), 0) || 0;
                    const taxAmount = subtotal * ((invoice.tax_amount || 0) / 100);
                    const total = subtotal - discounts + taxAmount;

                    return (
                      <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h3 className="font-medium">Invoice #{invoice.invoice_number}</h3>
                              {invoice.booking && (
                                <span className="text-xs text-gray-500 font-mono">
                                  Booking: {invoice.booking.id.slice(0, 8)}
                                </span>
                              )}
                              <Badge className={`${getStatusColor(invoice.status)} flex items-center gap-1`}>
                                {getStatusIcon(invoice.status)}
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                              {invoice.generated_from_booking && (
                                <Badge variant="outline" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  From Booking
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{invoice.description}</p>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="sm" onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' && (
                              <Button variant="ghost" size="sm" onClick={() => handleEditInvoice(invoice)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {invoice.status === 'draft' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleStatusChange(invoice.id, 'sent')}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            {['sent', 'pending', 'overdue'].includes(invoice.status) && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleAddPayment(invoice)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(invoice)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Booking Details Section */}
                        {invoice.booking && (
                          <div className="mb-3 p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <span className="text-muted-foreground block text-xs font-medium">Booking Date</span>
                                <span className="font-medium text-foreground">
                                  {formatDateSafe(invoice.booking.start_time, 'dd/MM/yyyy HH:mm')}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs font-medium">Booking Status</span>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {invoice.booking.status || 'N/A'}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs font-medium">Service</span>
                                <span className="text-foreground truncate block">
                                  {invoice.booking.services?.title || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-xs font-medium">Booking ID</span>
                                <span className="font-mono text-xs text-muted-foreground">
                                  {invoice.booking.id.slice(0, 13)}...
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Financial Details */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <PoundSterling className="h-4 w-4" />
                              <span className="font-medium text-lg text-gray-900">{formatCurrency(total)}</span>
                              {(invoice.tax_amount || 0) > 0 && (
                                <span className="text-xs">(+{invoice.tax_amount}% tax)</span>
                              )}
                              {discounts > 0 && (
                                <span className="text-xs">(-{formatCurrency(discounts)} discount)</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Due: {formatDateSafe(invoice.due_date)}</span>
                            </div>
                            {invoice.service_provided_date && (
                              <div className="text-xs">
                                Service: {formatDateSafe(invoice.service_provided_date)}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Created: {formatDateSafe(invoice.invoice_date)}</span>
                            {invoice.sent_date && (
                              <span>• Sent: {formatDateSafe(invoice.sent_date)}</span>
                            )}
                            {invoice.paid_date && (
                              <span>• Paid: {formatDateSafe(invoice.paid_date)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
              <div className="space-y-4">
                {billingItems.flatMap(invoice => 
                  (invoice.payment_records || []).map(payment => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Payment for Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(payment.payment_amount || 0)} via {payment.payment_method}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateSafe(payment.payment_date)}
                            {payment.transaction_id && ` • Ref: ${payment.transaction_id}`}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateEnhancedInvoiceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        clientId={clientId}
        uninvoicedBookings={uninvoicedBookings.filter(booking => booking.client_id === clientId)}
      />

      <EditInvoiceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        invoice={selectedInvoice}
      />

      <AddPaymentDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        invoice={selectedInvoice}
      />

      <ViewInvoiceDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        invoice={selectedInvoice}
        onEditInvoice={() => {
          if (selectedInvoice) {
            handleEditInvoice(selectedInvoice);
          }
        }}
      />
    </div>
  );
};
