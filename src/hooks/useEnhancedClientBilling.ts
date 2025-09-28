import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  organization_id?: string; // Optional since trigger will populate
  service_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  line_total: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'online' | 'check';
  transaction_id?: string;
  payment_date: string;
  payment_reference?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedClientBilling {
  id: string;
  client_id: string;
  description: string;
  amount: number;
  total_amount?: number;
  tax_amount: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  paid_date?: string;
  service_provided_date?: string;
  booking_id?: string;
  currency: string;
  payment_terms: string;
  notes?: string;
  invoice_type: 'manual' | 'automatic' | 'ledger_based';
  generated_from_booking: boolean;
  sent_date?: string;
  overdue_date?: string;
  // Ledger-specific fields
  start_date?: string;
  end_date?: string;
  net_amount?: number;
  vat_amount?: number;
  total_invoiced_hours_minutes?: number;
  is_ledger_locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  authority_type?: string;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
  payment_records?: PaymentRecord[];
}

export interface UninvoicedBooking {
  booking_id: string;
  client_id: string;
  client_name: string;
  service_title: string;
  start_time: string;
  end_time: string;
  revenue: number;
  days_since_service: number;
}

// Fetch enhanced client billing with line items and payments
const fetchEnhancedClientBilling = async (clientId: string): Promise<EnhancedClientBilling[]> => {
  console.log('[fetchEnhancedClientBilling] Fetching enhanced billing for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_billing')
    .select(`
      *,
      line_items:invoice_line_items(*),
      payment_records(*)
    `)
    .eq('client_id', clientId)
    .order('invoice_date', { ascending: false });

  if (error) {
    console.error('[fetchEnhancedClientBilling] Error:', error);
    throw error;
  }
  
  console.log('[fetchEnhancedClientBilling] Fetched enhanced billing:', data);
  // Type assertion to handle status field properly
  return (data || []) as EnhancedClientBilling[];
};

// Fetch uninvoiced bookings - only call if branchId is a valid UUID
const fetchUninvoicedBookings = async (branchId?: string): Promise<UninvoicedBooking[]> => {
  console.log('[fetchUninvoicedBookings] Fetching uninvoiced bookings for branch:', branchId);
  
  // Validate UUID format before making the call
  if (!branchId || !isValidUUID(branchId)) {
    console.log('[fetchUninvoicedBookings] Invalid or missing branch ID, returning empty array');
    return [];
  }
  
  const { data, error } = await supabase.rpc('get_uninvoiced_bookings', {
    branch_id_param: branchId
  });

  if (error) {
    console.error('[fetchUninvoicedBookings] Error:', error);
    throw error;
  }
  
  console.log('[fetchUninvoicedBookings] Fetched uninvoiced bookings:', data);
  return data || [];
};

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Create enhanced invoice with line items
const createEnhancedInvoice = async (invoiceData: {
  client_id: string;
  description: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  tax_amount?: number;
  currency?: string;
  payment_terms?: string;
  notes?: string;
  booking_id?: string;
  service_provided_date?: string;
  line_items: Array<{
    service_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }>;
}) => {
  console.log('[createEnhancedInvoice] Creating enhanced invoice:', invoiceData);
  
  // Create the main invoice with required amount field
  const { data: invoice, error: invoiceError } = await supabase
    .from('client_billing')
    .insert([{
      client_id: invoiceData.client_id,
      description: invoiceData.description,
      invoice_number: invoiceData.invoice_number,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      amount: 0, // Will be calculated by the function
      tax_amount: invoiceData.tax_amount || 0,
      currency: invoiceData.currency || 'GBP', // Fixed to GBP
      payment_terms: invoiceData.payment_terms || '30 days',
      notes: invoiceData.notes,
      booking_id: invoiceData.booking_id,
      service_provided_date: invoiceData.service_provided_date,
      status: 'draft',
      generated_from_booking: !!invoiceData.booking_id,
      invoice_type: invoiceData.booking_id ? 'automatic' : 'manual',
      organization_id: '', // Trigger will populate with correct value
    }])
    .select()
    .single();

  if (invoiceError) {
    console.error('[createEnhancedInvoice] Invoice creation error:', invoiceError);
    throw invoiceError;
  }

  // Create line items
  const lineItemsData = invoiceData.line_items.map(item => ({
    invoice_id: invoice.id,
    service_id: item.service_id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_amount: item.discount_amount || 0,
    line_total: (item.quantity * item.unit_price) - (item.discount_amount || 0),
    organization_id: '', // Trigger will populate with correct value
  }));

  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .insert(lineItemsData);

  if (lineItemsError) {
    console.error('[createEnhancedInvoice] Line items creation error:', lineItemsError);
    throw lineItemsError;
  }

  // Calculate totals
  await supabase.rpc('calculate_invoice_total', { invoice_id: invoice.id });

  console.log('[createEnhancedInvoice] Enhanced invoice created successfully');
  return invoice;
};

// Update invoice data
const updateInvoice = async (invoiceId: string, invoiceData: {
  description?: string;
  invoice_date?: string;
  due_date?: string;
  tax_amount?: number;
  notes?: string;
  status?: string;
  line_items?: Array<{
    id?: string;
    service_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
  }>;
}) => {
  console.log('[updateInvoice] Updating invoice:', invoiceId, invoiceData);
  
  // Update the main invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('client_billing')
    .update({
      description: invoiceData.description,
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date,
      tax_amount: invoiceData.tax_amount || 0,
      notes: invoiceData.notes,
      status: invoiceData.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', invoiceId)
    .select()
    .single();

  if (invoiceError) {
    console.error('[updateInvoice] Invoice update error:', invoiceError);
    throw invoiceError;
  }

  // Update line items if provided
  if (invoiceData.line_items) {
    // First, delete existing line items
    const { error: deleteError } = await supabase
      .from('invoice_line_items')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) {
      console.error('[updateInvoice] Error deleting line items:', deleteError);
      throw deleteError;
    }

    // Then insert new line items
    const lineItemsData = invoiceData.line_items.map(item => ({
      invoice_id: invoiceId,
      service_id: item.service_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount || 0,
      line_total: (item.quantity * item.unit_price) - (item.discount_amount || 0),
      organization_id: '', // Trigger will populate with correct value
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsData);

    if (lineItemsError) {
      console.error('[updateInvoice] Line items creation error:', lineItemsError);
      throw lineItemsError;
    }

    // Recalculate totals
    await supabase.rpc('calculate_invoice_total', { invoice_id: invoiceId });
  }

  console.log('[updateInvoice] Invoice updated successfully');
  return invoice;
};

// Update invoice status
const updateInvoiceStatus = async (invoiceId: string, status: string, additionalData?: any) => {
  console.log('[updateInvoiceStatus] Updating invoice status:', invoiceId, status);
  
  const updateData: any = { status };
  
  if (status === 'paid' && !additionalData?.paid_date) {
    updateData.paid_date = new Date().toISOString().split('T')[0];
  }
  
  if (status === 'sent' && !additionalData?.sent_date) {
    updateData.sent_date = new Date().toISOString().split('T')[0];
  }
  
  if (additionalData) {
    Object.assign(updateData, additionalData);
  }

  const { data, error } = await supabase
    .from('client_billing')
    .update(updateData)
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[updateInvoiceStatus] Error:', error);
    throw error;
  }

  console.log('[updateInvoiceStatus] Status updated successfully');
  return data;
};

// Add payment record
const addPaymentRecord = async (paymentData: {
  invoice_id: string;
  payment_amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_reference?: string;
  notes?: string;
}) => {
  console.log('[addPaymentRecord] Adding payment record:', paymentData);
  
  const { data, error } = await supabase
    .from('payment_records')
    .insert([paymentData])
    .select()
    .single();

  if (error) {
    console.error('[addPaymentRecord] Error:', error);
    throw error;
  }

  // Check if invoice is fully paid and update status
  const { data: invoice } = await supabase
    .from('client_billing')
    .select('total_amount')
    .eq('id', paymentData.invoice_id)
    .single();

  if (invoice) {
    const { data: totalPayments } = await supabase
      .from('payment_records')
      .select('payment_amount')
      .eq('invoice_id', paymentData.invoice_id);

    const totalPaid = totalPayments?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
    
    if (totalPaid >= invoice.total_amount) {
      await updateInvoiceStatus(paymentData.invoice_id, 'paid');
    }
  }

  console.log('[addPaymentRecord] Payment record added successfully');
  return data;
};

// React Query hooks
export const useEnhancedClientBilling = (clientId: string) => {
  return useQuery({
    queryKey: ['enhanced-client-billing', clientId],
    queryFn: () => fetchEnhancedClientBilling(clientId),
    enabled: Boolean(clientId),
  });
};

export const useUninvoicedBookings = (branchId?: string) => {
  return useQuery({
    queryKey: ['uninvoiced-bookings', branchId],
    queryFn: () => fetchUninvoicedBookings(branchId),
    enabled: Boolean(branchId) && isValidUUID(branchId || ''),
  });
};

export const useCreateEnhancedInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEnhancedInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['uninvoiced-bookings'] });
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      console.error('[useCreateEnhancedInvoice] Error:', error);
      toast.error('Failed to create invoice', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, invoiceData }: { 
      invoiceId: string; 
      invoiceData: Parameters<typeof updateInvoice>[1] 
    }) => updateInvoice(invoiceId, invoiceData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing', data.client_id] });
      toast.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      console.error('[useUpdateInvoice] Error:', error);
      toast.error('Failed to update invoice', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, status, additionalData }: { 
      invoiceId: string; 
      status: string; 
      additionalData?: any 
    }) => updateInvoiceStatus(invoiceId, status, additionalData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing', data.client_id] });
      toast.success('Invoice status updated successfully');
    },
    onError: (error: any) => {
      console.error('[useUpdateInvoiceStatus] Error:', error);
      toast.error('Failed to update invoice status', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

// Delete invoice with proper cascade handling
const deleteInvoice = async (invoiceId: string) => {
  console.log('[deleteInvoice] Deleting invoice:', invoiceId);
  
  // First delete line items (foreign key constraint)
  const { error: lineItemsError } = await supabase
    .from('invoice_line_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (lineItemsError) {
    console.error('[deleteInvoice] Error deleting line items:', lineItemsError);
    throw lineItemsError;
  }

  // Then delete payment records
  const { error: paymentsError } = await supabase
    .from('payment_records')
    .delete()
    .eq('invoice_id', invoiceId);

  if (paymentsError) {
    console.error('[deleteInvoice] Error deleting payment records:', paymentsError);
    throw paymentsError;
  }

  // Finally delete the main invoice
  const { data, error } = await supabase
    .from('client_billing')
    .delete()
    .eq('id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[deleteInvoice] Error deleting invoice:', error);
    throw error;
  }

  console.log('[deleteInvoice] Invoice deleted successfully');
  return data;
};

export const useAddPaymentRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPaymentRecord,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      console.error('[useAddPaymentRecord] Error:', error);
      toast.error('Failed to record payment', {
        description: error.message || 'Please try again later'
      });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      console.error('[useDeleteInvoice] Error:', error);
      toast.error('Failed to delete invoice', {
        description: error.message || 'Please try again later'
      });
    },
  });
};
