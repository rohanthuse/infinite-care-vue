import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileText, PoundSterling, Calculator } from 'lucide-react';
import FinancialSummaryCards from './FinancialSummaryCards';
import EnhancedInvoicesDataTable from './EnhancedInvoicesDataTable';
import PaymentsDataTable from './PaymentsDataTable';
import { EnhancedCreateInvoiceDialog } from './EnhancedCreateInvoiceDialog';
import { EditInvoiceDialog } from '../clients/dialogs/EditInvoiceDialog';
import { RecordPaymentDialog } from './RecordPaymentDialog';
import { ViewInvoiceDialog } from '../clients/dialogs/ViewInvoiceDialog';
import { ViewPaymentDialog } from './ViewPaymentDialog';
import { SendToClientDialog } from './SendToClientDialog';
import { EnhancedClientSelector } from '@/components/ui/enhanced-client-selector';
import { useUninvoicedBookings, EnhancedClientBilling } from '@/hooks/useEnhancedClientBilling';
import { InvoicePeriodSelector, type PeriodDetails } from './InvoicePeriodSelector';
import { BulkInvoicePreviewDialog } from './BulkInvoicePreviewDialog';
import { BulkGenerationProgressDialog } from './BulkGenerationProgressDialog';
import { BulkGenerationResultsDialog } from './BulkGenerationResultsDialog';
import { InvoiceGenerationWidget } from './InvoiceGenerationWidget';
import { useBulkInvoiceGeneration } from '@/hooks/useBulkInvoiceGeneration';
import { useSendInvoiceToClient } from '@/hooks/useSendInvoiceToClient';
import type { BulkGenerationProgress, BulkGenerationResult } from '@/hooks/useBulkInvoiceGeneration';
import { useBranchInvoices } from '@/hooks/useBranchInvoices';
import { useBranchPayments } from '@/hooks/useBranchPayments';
import { useBranchInfo } from '@/hooks/useBranchInfo';
import { useClientServicePayer, getServicePayerConfig, type ServicePayerConfig } from '@/hooks/useClientServicePayer';
import { ReportExporter } from '@/utils/reportExporter';
import { supabase } from '@/integrations/supabase/client';
import { generateInvoicePDF } from '@/utils/invoicePdfGenerator';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';


interface InvoicesPaymentsTabProps {
  branchId?: string;
  branchName?: string;
}

const InvoicesPaymentsTab: React.FC<InvoicesPaymentsTabProps> = ({ branchId, branchName }) => {
  const { data: branchInfo, isLoading: isBranchLoading } = useBranchInfo(branchId);
  const organizationId = branchInfo?.organization_id || '';

  const [activeSubTab, setActiveSubTab] = useState('invoices');
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isViewInvoiceOpen, setIsViewInvoiceOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClientName, setSelectedClientName] = useState<string>('');
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<EnhancedClientBilling | null>(null);
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState<EnhancedClientBilling | null>(null);
  const [selectedInvoiceIdForPayment, setSelectedInvoiceIdForPayment] = useState<string>('');
  const [selectedPaymentForView, setSelectedPaymentForView] = useState<string | null>(null);
  const [isViewPaymentOpen, setIsViewPaymentOpen] = useState(false);
  const [showClientSelectionForInvoice, setShowClientSelectionForInvoice] = useState(false);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);
  const [isInvoicePeriodOpen, setIsInvoicePeriodOpen] = useState(false);
  const [selectedInvoicePeriod, setSelectedInvoicePeriod] = useState<PeriodDetails | null>(null);
  
  // Send to Client state - expanded to hold full validation data
  const [sendToClientDialogOpen, setSendToClientDialogOpen] = useState(false);
  const [selectedInvoiceForSend, setSelectedInvoiceForSend] = useState<{
    id: string;
    invoiceNumber: string;
    isResend: boolean;
    clientId: string;
    clientName: string;
    billToType: 'private' | 'authority' | null;
  } | null>(null);

  // Fetch service payer config for the selected invoice's client
  const { data: servicePayerData } = useClientServicePayer(selectedInvoiceForSend?.clientId || '');
  const servicePayerConfig: ServicePayerConfig | null = servicePayerData 
    ? getServicePayerConfig(servicePayerData.service_payer) 
    : null;
  
  // Bulk generation states
  const [showBulkPreview, setShowBulkPreview] = useState(false);
  const [showBulkProgress, setShowBulkProgress] = useState(false);
  const [showBulkResults, setShowBulkResults] = useState(false);
  const [bulkGenerationResults, setBulkGenerationResults] = useState<BulkGenerationResult | null>(null);
  const [bulkGenerationProgress, setBulkGenerationProgress] = useState<BulkGenerationProgress>({ 
    current: 0, 
    total: 0 
  });

  const { generateBulkInvoices } = useBulkInvoiceGeneration();
  const sendInvoiceToClient = useSendInvoiceToClient();
  const queryClient = useQueryClient();
  
  const { data: uninvoicedBookings } = useUninvoicedBookings(branchId);
  
  // Fetch unpaid invoices for payment recording
  const { data: allInvoices } = useBranchInvoices(branchId);
  const { data: allPayments } = useBranchPayments(branchId);
  const unpaidInvoices = allInvoices?.filter(invoice => 
    invoice.remaining_amount > 0 && 
    invoice.id && 
    invoice.id.trim() !== '' &&
    invoice.invoice_number &&
    invoice.client_name
  ).map(invoice => ({
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

  // Handler for creating invoice - now opens period selector first
  const handleCreateInvoice = () => {
    // First open period selection dialog
    setIsInvoicePeriodOpen(true);
  };

  // Handler for period selection (manual invoice)
  const handleInvoicePeriodSelect = (periodDetails: PeriodDetails) => {
    setSelectedInvoicePeriod(periodDetails);
    setIsInvoicePeriodOpen(false);
    setShowClientSelectionForInvoice(true);
  };

  // Handler for bulk generation
  const handleBulkGenerate = (periodDetails: PeriodDetails) => {
    setSelectedInvoicePeriod(periodDetails);
    setIsInvoicePeriodOpen(false);
    setShowBulkPreview(true);
  };

  // Handler for confirming bulk generation
  const handleConfirmBulkGenerate = async () => {
    if (!selectedInvoicePeriod || !branchId) {
      toast.error('Missing invoice period or branch information.');
      return;
    }
    
    if (!organizationId || isBranchLoading) {
      toast.error('Branch information is still loading. Please wait a moment and try again.');
      return;
    }
    setShowBulkPreview(false);
    setShowBulkProgress(true);
    try {
      const results = await generateBulkInvoices(
        selectedInvoicePeriod,
        branchId,
        organizationId,
        (progress) => setBulkGenerationProgress(progress)
      );
      setShowBulkProgress(false);
      setBulkGenerationResults(results);
      setShowBulkResults(true);
      
      // ✅ Use refetchQueries to immediately update the invoice table
      await queryClient.refetchQueries({ 
        queryKey: ['branch-invoices', branchId],
        type: 'active' 
      });
      
      // Also refetch stats for the summary cards
      await queryClient.refetchQueries({ 
        queryKey: ['branch-invoice-stats', branchId],
        type: 'active'
      });
      
      if (results.successCount > 0) {
        toast.success(`Successfully generated ${results.successCount} invoice${results.successCount !== 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      setShowBulkProgress(false);
      toast.error('Failed to generate bulk invoices');
    }
  };

  const handleViewGeneratedInvoices = () => {
    setActiveSubTab('invoices');
  };

  // Handler for when client is selected from the modal - now opens enhanced flow
  const handleClientSelectedForInvoice = (clientId: string) => {
    setSelectedClientId(clientId);
    setShowClientSelectionForInvoice(false);
    setIsCreateInvoiceOpen(true);
  };

  // Handler for booking completion to update counts
  const handleBookingCompleted = () => {
    // Invalidate invoice generation queue to refresh counts
    queryClient.invalidateQueries({ queryKey: ['invoice-generation-queue', branchId] });
  };

  // Handler for invoice creation to mark bookings as invoiced
  const handleInvoiceCreated = async (invoiceId: string, bookingIds: string[]) => {
    try {
      // Update bookings to mark them as invoiced
      if (bookingIds && bookingIds.length > 0) {
        const { error } = await supabase
          .from('bookings')
          .update({ 
            is_invoiced: true, 
            included_in_invoice_id: invoiceId 
          })
          .in('id', bookingIds);

        if (error) {
          console.error('Error marking bookings as invoiced:', error);
        } else {
          // ✅ Refetch instead of just invalidate
          await queryClient.refetchQueries({ 
            queryKey: ['invoice-generation-queue', branchId],
            type: 'active'
          });
          await queryClient.refetchQueries({ 
            queryKey: ['branch-invoices', branchId],
            type: 'active'
          });
          await queryClient.refetchQueries({ 
            queryKey: ['branch-invoice-stats', branchId],
            type: 'active'
          });
        }
      }
    } catch (error) {
      console.error('Error in handleInvoiceCreated:', error);
    }
  };

  // Handler for downloading invoice as PDF
  const handleDownloadInvoice = async (invoiceId: string) => {
    setDownloadingInvoiceId(invoiceId);
    try {
      const { data: invoiceData, error } = await supabase
        .from('client_billing')
        .select(`
          *,
          invoice_line_items(*),
          payment_records(*),
          clients(
            first_name, 
            last_name, 
            preferred_name, 
            email, 
            address,
            phone,
            branch_id,
            branches(organization_id)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      const client = invoiceData.clients;
      const clientName = `${client?.preferred_name || client?.first_name || ''} ${client?.last_name || ''}`.trim();

      // Fetch organization details with logo
      const orgId = client?.branches?.organization_id || organizationId;
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('name, address, contact_email, contact_phone, logo_url, website, registration_number')
        .eq('id', orgId)
        .maybeSingle();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      }

      // Load logo as base64 if available
      let logoBase64: string | null = null;
      if (orgData?.logo_url) {
        try {
          const response = await fetch(orgData.logo_url);
          if (response.ok) {
            const blob = await response.blob();
            logoBase64 = await new Promise((resolve) => {
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

      // Fetch cancelled bookings for the invoice period
      let cancelledBookingsForPdf: any[] = [];
      if (invoiceData.start_date && invoiceData.end_date) {
        const { data: cancelledData } = await supabase
          .from('bookings')
          .select(`
            id,
            start_time,
            cancellation_reason,
            suspension_honor_staff_payment,
            staff_payment_amount,
            staff:staff_id (first_name, last_name)
          `)
          .eq('client_id', invoiceData.client_id)
          .eq('status', 'cancelled')
          .eq('suspension_honor_staff_payment', true)
          .gte('start_time', invoiceData.start_date)
          .lte('start_time', `${invoiceData.end_date}T23:59:59`);

        if (cancelledData) {
          cancelledBookingsForPdf = cancelledData
            .filter((b: any) => b.staff_payment_amount)
            .map((b: any) => ({
              id: b.id,
              start_time: b.start_time,
              cancellation_reason: b.cancellation_reason,
              staff_name: b.staff?.first_name && b.staff?.last_name 
                ? `${b.staff.first_name} ${b.staff.last_name}` 
                : null,
              staff_payment_amount: b.staff_payment_amount,
            }));
        }
      }

      await generateInvoicePDF({
        invoice: {
          ...invoiceData,
          line_items: invoiceData.invoice_line_items || [],
          payment_records: (invoiceData.payment_records || []).map(record => ({
            ...record,
            payment_method: record.payment_method as any
          }))
        } as any,
        clientName,
        clientAddress: client?.address || '',
        clientEmail: client?.email || '',
        clientPhone: client?.phone || '',
        organizationInfo: {
          name: orgData?.name || 'Care Service Provider',
          address: orgData?.address || 'Organisation Address',
          email: orgData?.contact_email || 'contact@organisation.com',
          phone: orgData?.contact_phone,
          website: orgData?.website,
          registrationNumber: orgData?.registration_number,
          logoBase64
        },
        cancelledBookings: cancelledBookingsForPdf
      });

      toast.success(`Invoice ${invoiceData.invoice_number} downloaded successfully.`);
    } catch (error) {
      console.error('Invoice download error:', error);
      toast.error(error instanceof Error ? error.message : "Unable to download invoice. Please try again.");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Handler for editing invoice - fetch FULL invoice data for comprehensive EditInvoiceDialog
  const handleEditInvoice = async (invoiceId: string) => {
    try {
      const { data: invoiceData, error } = await supabase
        .from('client_billing')
        .select(`
          *,
          invoice_line_items(*),
          payment_records(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Transform to EnhancedClientBilling type for EditInvoiceDialog
      const enhancedInvoice: EnhancedClientBilling = {
        ...invoiceData,
        status: invoiceData.status as 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded',
        invoice_type: invoiceData.invoice_type as 'manual' | 'automatic',
        line_items: invoiceData.invoice_line_items || [],
        payment_records: (invoiceData.payment_records || []).map(record => ({
          ...record,
          payment_method: record.payment_method as 'cash' | 'card' | 'bank_transfer' | 'online' | 'check'
        }))
      };

      setSelectedInvoiceForEdit(enhancedInvoice);
      setIsEditInvoiceOpen(true);
    } catch (error) {
      console.error('Error loading invoice for edit:', error);
      toast.error("Unable to load invoice for editing. Please try again.");
    }
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

  // Handler for sending invoice to client portal - fetch full invoice data
  const handleSendToClient = async (invoiceId: string, invoiceNumber: string, isResend: boolean) => {
    try {
      // Fetch invoice with client details
      const { data: invoice, error } = await supabase
        .from('client_billing')
        .select(`
          id,
          invoice_number,
          client_id,
          bill_to_type,
          clients!inner(first_name, last_name, preferred_name)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      const client = invoice.clients as { first_name?: string; last_name?: string; preferred_name?: string } | null;
      const clientName = client 
        ? `${client.preferred_name || client.first_name || ''} ${client.last_name || ''}`.trim() 
        : 'Unknown Client';

      setSelectedInvoiceForSend({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number || invoiceNumber,
        isResend,
        clientId: invoice.client_id,
        clientName,
        billToType: invoice.bill_to_type as 'private' | 'authority' | null,
      });
      setSendToClientDialogOpen(true);
    } catch (error) {
      console.error('Error loading invoice for send:', error);
      toast.error('Failed to load invoice details');
    }
  };

  // Confirm sending invoice to client
  const confirmSendToClient = () => {
    if (selectedInvoiceForSend) {
      sendInvoiceToClient.mutate(
        { invoiceId: selectedInvoiceForSend.id, branchId },
        {
          onSuccess: () => {
            setSendToClientDialogOpen(false);
            setSelectedInvoiceForSend(null);
          },
          onError: () => {
            // Error is handled by the hook
          },
        }
      );
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

      {/* Invoice Generation Queue Widget */}
      <InvoiceGenerationWidget 
        branchId={branchId!} 
        onViewReadyClients={() => setIsInvoicePeriodOpen(true)} 
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Client for Invoice
            </label>
            <EnhancedClientSelector
              branchId={branchId!}
              selectedClientId={selectedClientId}
              onClientSelect={(clientId, clientData) => {
                setSelectedClientId(clientId);
                setSelectedClientName(clientData?.full_name || '');
              }}
              placeholder="Search and select a client..."
              className="w-full lg:w-96"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button 
              className="flex items-center gap-2"
              onClick={handleCreateInvoice}
              disabled={isBranchLoading}
            >
              <PlusCircle className="h-4 w-4" />
              Generate Invoice
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
        <TabsList className="grid w-full grid-cols-2 max-w-2xl">
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Invoices
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
            <EnhancedInvoicesDataTable 
              branchId={branchId!}
              branchName={branchName}
              onViewInvoice={handleViewInvoice}
              onEditInvoice={handleEditInvoice}
              onRecordPayment={handleRecordPayment}
              onCreateInvoice={handleCreateInvoice}
              onExportInvoice={handleDownloadInvoice}
              onSendToClient={handleSendToClient}
              onDeleteInvoice={(invoiceId) => {
                console.log(`Invoice ${invoiceId} deleted successfully`);
              }}
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

      {/* Invoice Period Selector */}
      <InvoicePeriodSelector
        isOpen={isInvoicePeriodOpen}
        onClose={() => {
          setIsInvoicePeriodOpen(false);
          setSelectedInvoicePeriod(null);
        }}
        onPeriodSelect={handleInvoicePeriodSelect}
        onBulkGenerate={handleBulkGenerate}
        branchId={branchId}
        organizationId={organizationId}
        preSelectedClientId={selectedClientId || undefined}
        preSelectedClientName={selectedClientName || undefined}
      />

      <BulkInvoicePreviewDialog
        isOpen={showBulkPreview}
        onClose={() => setShowBulkPreview(false)}
        periodDetails={selectedInvoicePeriod}
        branchId={branchId!}
        organizationId={organizationId}
        onConfirm={handleConfirmBulkGenerate}
      />

      <BulkGenerationProgressDialog
        isOpen={showBulkProgress}
        progress={bulkGenerationProgress}
      />

      <BulkGenerationResultsDialog
        isOpen={showBulkResults}
        onClose={() => {
          setShowBulkResults(false);
          setBulkGenerationResults(null);
        }}
        results={bulkGenerationResults}
        onViewInvoices={handleViewGeneratedInvoices}
      />

      {/* Invoice Creation Dialog - for NEW invoices only */}
      <EnhancedCreateInvoiceDialog
        isOpen={isCreateInvoiceOpen}
        onClose={() => {
          setIsCreateInvoiceOpen(false);
          setSelectedClientId('');
          setSelectedClientName('');
          setSelectedInvoicePeriod(null);
        }}
        branchId={branchId!}
        organizationId={organizationId || ''}
        preSelectedClientId={selectedClientId}
        invoicePeriod={selectedInvoicePeriod || undefined}
      />

      {/* Edit Invoice Dialog - comprehensive editing for existing invoices */}
      <EditInvoiceDialog
        open={isEditInvoiceOpen}
        onOpenChange={(open) => {
          setIsEditInvoiceOpen(open);
          if (!open) setSelectedInvoiceForEdit(null);
        }}
        invoice={selectedInvoiceForEdit}
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
        onEditInvoice={handleEditInvoice}
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

      {/* Send to Client Dialog */}
      <SendToClientDialog
        open={sendToClientDialogOpen}
        onOpenChange={(open) => {
          setSendToClientDialogOpen(open);
          if (!open) setSelectedInvoiceForSend(null);
        }}
        onConfirm={confirmSendToClient}
        isLoading={sendInvoiceToClient.isPending}
        invoiceNumber={selectedInvoiceForSend?.invoiceNumber}
        isResend={selectedInvoiceForSend?.isResend}
        clientName={selectedInvoiceForSend?.clientName}
        clientId={selectedInvoiceForSend?.clientId}
        billToType={selectedInvoiceForSend?.billToType}
        servicePayerConfig={servicePayerConfig}
      />

      {/* Client Selection Modal for Invoice Creation */}
      {showClientSelectionForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Client for Invoice</h3>
            <EnhancedClientSelector
              branchId={branchId!}
              selectedClientId=""
              onClientSelect={handleClientSelectedForInvoice}
              placeholder="Search and select a client..."
              className="w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowClientSelectionForInvoice(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPaymentsTab;