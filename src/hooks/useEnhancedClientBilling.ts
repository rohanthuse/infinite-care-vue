import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface EnhancedClientBilling {
  // Core fields
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  status: string; // Made flexible to accept database strings
  invoice_date: string;
  due_date: string;
  description: string;
  
  // Additional database fields
  paid_date?: string;
  service_provided_date?: string;
  booking_id?: string;
  tax_amount?: number;
  total_amount?: number;
  currency?: string;
  payment_terms?: string;
  notes?: string;
  invoice_type?: string; // Made flexible to accept 'ledger_based' and other types
  generated_from_booking?: boolean;
  sent_date?: string;
  overdue_date?: string;
  organization_id?: string;
  start_date?: string;
  end_date?: string;
  
  // Time tracking fields
  booked_time_minutes?: number;
  actual_time_minutes?: number;
  total_invoiced_hours_minutes?: number;
  
  // Authority vs Private fields
  pay_method?: string;
  authority_type?: string;
  invoice_method?: string;
  client_group_id?: string;
  bill_to_type?: string; // Made flexible to accept database strings
  authority_id?: string;
  consolidation_type?: string;
  bill_to_address?: any;
  service_to_address?: any;
  
  // Status flags
  is_ready_to_send?: boolean;
  is_former_client?: boolean;
  is_locked?: boolean;
  locked_at?: string;
  locked_by?: string;
  net_amount?: number;
  vat_amount?: number;
  is_ledger_locked?: boolean;
  
  // Relationships (populated via joins)
  line_items?: InvoiceLineItem[];
  payment_records?: PaymentRecord[];
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  service_id?: string;
  description: string;
  quantity?: number;
  unit_price: number;
  discount_amount?: number;
  line_total: number;
  visit_date?: string;
  day_type?: string;
  service_start_time?: string;
  service_end_time?: string;
  rate_type_applied?: string;
  duration_minutes?: number;
  rate_per_unit?: number;
  bank_holiday_multiplier_applied?: number;
  visit_record_id?: string;
  booking_id?: string;
  created_at?: string;
  updated_at?: string;
  organization_id?: string;
}

export interface PaymentRecord {
  id: string;
  invoice_id: string;
  payment_amount: number;
  payment_method: string;
  transaction_id?: string;
  payment_date: string;
  payment_reference?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UninvoicedBooking {
  id: string;
  client_id: string;
  staff_id?: string;
  start_time: string;
  end_time: string;
  revenue?: number;
  service_id?: string;
  status?: string;
  notes?: string;
  branch_id?: string;
  organization_id?: string;
  created_at?: string;
  
  // Computed/joined fields that components expect
  booking_id?: string;  // alias for id
  service_title?: string;  // from service join
  client_name?: string;    // from client join
  days_since_service?: number;  // computed
}

// Fetch enhanced billing data
export const useEnhancedClientBilling = (clientId: string) => {
  return useQuery({
    queryKey: ['enhanced-client-billing', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_billing')
        .select(`
          *,
          line_items:invoice_line_items(*),
          payment_records(*)
        `)
        .eq('client_id', clientId);
      
      if (error) throw error;
      return data;
    },
    enabled: Boolean(clientId),
  });
};

// Fetch uninvoiced bookings
export const useUninvoicedBookings = (clientId: string) => {
  return useQuery({
    queryKey: ['uninvoiced-bookings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services(title),
          clients(first_name, last_name)
        `)
        .eq('client_id', clientId)
        .is('invoice_id', null);
      
      if (error) throw error;
      
      // Transform data to match expected interface
      return data?.map(booking => ({
        ...booking,
        booking_id: booking.id,
        service_title: booking.services?.title || 'Unknown Service',
        client_name: booking.clients ? `${booking.clients.first_name} ${booking.clients.last_name}` : 'Unknown Client',
        days_since_service: Math.floor((new Date().getTime() - new Date(booking.start_time).getTime()) / (1000 * 60 * 60 * 24))
      })) || [];
    },
    enabled: Boolean(clientId),
  });
};

// Create enhanced invoice
export const useCreateEnhancedInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('client_billing')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    },
  });
};

// Update invoice
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('client_billing')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast.error('Failed to update invoice');
    },
  });
};

// Update invoice status
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('client_billing')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Invoice status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    },
  });
};

// Add payment record
export const useAddPaymentRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('payment_records')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      toast.success('Payment recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('client_billing')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      return invoiceId;
    },
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    },
  });
};