import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPortalInvoice {
  id: string;
  client_id: string;
  organization_id: string;
  description: string;
  amount: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  paid_date?: string | null;
  total_amount?: number | null;
  net_amount?: number | null;
  tax_amount?: number | null;
  vat_amount?: number | null;
  service_provided_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
  payment_records?: Array<{
    id: string;
    payment_date: string;
    payment_amount: number;
    payment_method: string;
  }>;
}

/**
 * Hook to fetch all invoices for a client on the client portal.
 * This fetches ALL invoices (not just booking-linked ones) and includes
 * line items and payment records.
 */
export const useClientPortalInvoices = (clientId: string) => {
  return useQuery({
    queryKey: ['client-portal-invoices', clientId],
    queryFn: async (): Promise<ClientPortalInvoice[]> => {
      const { data, error } = await supabase
        .from('client_billing')
        .select(`
          *,
          line_items:invoice_line_items(*),
          payment_records(*)
        `)
        .eq('client_id', clientId)
        .not('sent_date', 'is', null) // Only show invoices that have been sent to client
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      return (data || []) as ClientPortalInvoice[];
    },
    enabled: Boolean(clientId),
  });
};

/**
 * Helper function to determine the display status of an invoice.
 * Returns 'overdue' if the invoice is past due and not paid.
 */
export const getInvoiceDisplayStatus = (invoice: ClientPortalInvoice): string => {
  if (invoice.status === 'paid') return 'paid';
  
  // Check if overdue (due_date is past and status is not paid)
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  
  if (dueDate < today && invoice.status !== 'paid') {
    return 'overdue';
  }
  
  // Return original status for pending, sent, draft, etc.
  return invoice.status;
};
