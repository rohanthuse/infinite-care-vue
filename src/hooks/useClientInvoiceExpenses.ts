import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InvoiceExpense {
  id: string;
  expense_type: string;
  description: string;
  amount: number;
  expense_date: string;
  category?: string;
}

/**
 * Hook to fetch expenses linked to an invoice for the client portal.
 */
export const useClientInvoiceExpenses = (invoiceId: string) => {
  return useQuery({
    queryKey: ['client-invoice-expenses', invoiceId],
    queryFn: async (): Promise<InvoiceExpense[]> => {
      // Fetch expenses linked to invoice line items
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('created_at', { ascending: true });

      if (lineItemsError) throw lineItemsError;

      // Transform line items into expense format for display
      const expenses: InvoiceExpense[] = (lineItems || [])
        .filter(item => 
          item.description?.toLowerCase().includes('expense') ||
          item.description?.toLowerCase().includes('travel') ||
          item.description?.toLowerCase().includes('mileage')
        )
        .map(item => ({
          id: item.id,
          expense_type: 'expense',
          description: item.description || 'Expense',
          amount: item.line_total || (item.quantity * item.unit_price),
          expense_date: item.created_at,
          category: item.description?.toLowerCase().includes('travel') 
            ? 'travel' 
            : item.description?.toLowerCase().includes('mileage')
            ? 'mileage'
            : 'other',
        }));

      return expenses;
    },
    enabled: Boolean(invoiceId),
  });
};
