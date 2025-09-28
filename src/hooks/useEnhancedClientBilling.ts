import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
export interface EnhancedClientBilling {
  id: string;
  client_id: string;
  invoice_number: string;
  amount: number;
  status: string;
  invoice_date: string;
  due_date: string;
  description: string;
}

export interface UninvoicedBooking {
  id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  revenue: number;
}

// Fetch enhanced billing data
export const useEnhancedClientBilling = (clientId: string) => {
  return useQuery({
    queryKey: ['enhanced-client-billing', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_billing')
        .select('*')
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
        .select('*')
        .eq('client_id', clientId)
        .is('invoice_id', null);
      
      if (error) throw error;
      return data;
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