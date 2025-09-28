import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, PoundSterling } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FinancialSummaryCards from './FinancialSummaryCards';
import EnhancedInvoicesDataTable from './EnhancedInvoicesDataTable';
import PaymentsDataTable from './PaymentsDataTable';
import { CreateEnhancedInvoiceDialog } from '@/components/clients/dialogs/CreateEnhancedInvoiceDialog';
import { ViewInvoiceDialog } from '@/components/clients/dialogs/ViewInvoiceDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { ViewPaymentDialog } from './ViewPaymentDialog';
import { useClientsList } from '@/hooks/useAccountingData';
import { useUninvoicedBookings, EnhancedClientBilling } from '@/hooks/useEnhancedClientBilling';
import { useBranchInvoices } from '@/hooks/useBranchInvoices';
import { useBranchPayments } from '@/hooks/useBranchPayments';
import { ReportExporter } from '@/utils/reportExporter';
import { supabase } from '@/integrations/supabase/client';
import EnhancedInvoicesDataTable from './EnhancedInvoicesDataTable';

interface InvoicesPaymentsTabProps {
  branchId?: string;
  branchName?: string;
}

const InvoicesPaymentsTab: React.FC<InvoicesPaymentsTabProps> = ({ branchId, branchName }) => {
  const [activeSubTab, setActiveSubTab] = useState('invoices');
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<EnhancedClientBilling | null>(null);
  const [selectedInvoiceIdForPayment, setSelectedInvoiceIdForPayment] = useState<string>('');
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<string | null>(null);
  const [isViewPaymentOpen, setIsViewPaymentOpen] = useState(false);
  
  // Fetch clients for the dropdown
  const { data: clients } = useClientsList(branchId);
  const { data: uninvoicedBookings } = useUninvoicedBookings(branchId);
  
  // Fetch unpaid invoices for payment recording
  const { data: allInvoices } = useBranchInvoices(branchId);
  const { data: allPayments } = useBranchPayments(branchId);
  const unpaidInvoices = allInvoices?.filter(invoice => invoice.remaining_amount > 0).map(invoice => ({
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_name: invoice.client_name,
    remaining_amount: invoice.remaining_amount
  })) || [];

  // Handler for viewing invoice - find invoice from existing data
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      // First try to find in existing data
      const existingInvoice = allInvoices?.find(invoice => invoice.id === invoiceId);
      if (existingInvoice) {
        // Fetch full invoice details with line items
        const { data, error } = await supabase
          .from('client_billing')
          .select(`
            *,
            invoice_line_items(*),
            payment_records(*)
          `)
          .eq('id', invoiceId)
          .single();

        if (error) throw error;

        if (data) {
          const enhancedInvoice: EnhancedClientBilling = {
            ...data,
            status: data.status as 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded',
            invoice_type: data.invoice_type as 'manual' | 'automatic',
            line_items: data.invoice_line_items || [],
            payment_records: (data.payment_records || []).map(record => ({
              ...record,
              payment_method: record.payment_method as 'cash' | 'card' | 'bank_transfer' | 'online' | 'check'
            }))
          };

          setSelectedInvoiceForView(enhancedInvoice);
          setIsViewInvoiceOpen(true);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  // Handler for recording payment
  const handleRecordPayment = (invoiceId: string) => {
    setSelectedInvoiceIdForPayment(invoiceId);
    setIsRecordPaymentOpen(true);
  };

  // Handler for viewing payment
  const handleViewPayment = (paymentId: string) => {
    setSelectedPaymentForView(paymentId);
    setIsViewPaymentOpen(true);
  };

  // Handler for generating reports
  const handleGenerateReport = () => {
    if (activeSubTab === 'invoices' && allInvoices?.length) {
      const columns = ['invoice_number', 'client_name', 'total_amount', 'due_date', 'status', 'remaining_amount'];
      ReportExporter.exportToPDF({
        title: 'Invoices Report',
        data: allInvoices,
        columns,
        branchName,
        fileName: `${branchName?.replace(/\s+/g, '_')}_invoices_report.pdf`
      });
    } else if (activeSubTab === 'payments' && allPayments?.length) {
      const columns = ['payment_date', 'client_name', 'invoice_number', 'payment_amount', 'payment_method', 'payment_reference'];
      ReportExporter.exportToPDF({
        title: 'Payments Report',
        data: allPayments,
        columns,
        branchName,
        fileName: `${branchName?.replace(/\s+/g, '_')}_payments_report.pdf`
      });
    }
  };

  if (!branchId) {
    return (
      <div className="text-center py-8 text-gray-500">
        No branch selected
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary */}
      <FinancialSummaryCards branchId={branchId} />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client for Invoice
            </label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                    {client.pin_code && ` (${client.pin_code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              className="flex items-center gap-2"
              onClick={() => {
                if (selectedClientId) {
                  setIsCreateInvoiceOpen(true);
                }
              }}
              disabled={!selectedClientId}
            >
              <PlusCircle className="h-4 w-4" />
              Create Invoice
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => setIsRecordPaymentOpen(true)}
              disabled={unpaidInvoices.length === 0}
            >
              <PoundSterling className="h-4 w-4" />
              Record Payment
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleGenerateReport}
              disabled={(activeSubTab === 'invoices' && !allInvoices?.length) || (activeSubTab === 'payments' && !allPayments?.length)}
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices and Payments Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <PoundSterling className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">All Invoices</h3>
                <p className="text-sm text-gray-500">Manage and track all client invoices</p>
              </div>
            </div>
            <InvoicesDataTable 
              branchId={branchId}
              onViewInvoice={handleViewInvoice}
              onRecordPayment={handleRecordPayment}
            />
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Payment Records</h3>
                <p className="text-sm text-gray-500">Track all payment transactions</p>
              </div>
            </div>
            <PaymentsDataTable 
              branchId={branchId} 
              onViewPayment={handleViewPayment}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Invoice Creation Dialog */}
      <CreateEnhancedInvoiceDialog
        open={isCreateInvoiceOpen}
        onOpenChange={setIsCreateInvoiceOpen}
        clientId={selectedClientId}
        uninvoicedBookings={uninvoicedBookings?.filter(booking => booking.client_id === selectedClientId) || []}
      />

      {/* Record Payment Dialog */}
      <RecordPaymentDialog
        open={isRecordPaymentOpen}
        onOpenChange={setIsRecordPaymentOpen}
        preselectedInvoiceId={selectedInvoiceIdForPayment}
        availableInvoices={unpaidInvoices}
      />

      {/* View Invoice Dialog */}
      <ViewInvoiceDialog
        open={isViewInvoiceOpen}
        onOpenChange={setIsViewInvoiceOpen}
        invoice={selectedInvoiceForView}
      />

      {/* View Payment Dialog */}
      <ViewPaymentDialog
        open={isViewPaymentOpen}
        onOpenChange={(open) => {
          setIsViewPaymentOpen(open);
          if (!open) setSelectedPaymentForView(null);
        }}
        paymentId={selectedPaymentForView}
      />
    </div>
  );
};

export default InvoicesPaymentsTab;