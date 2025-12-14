import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EligibleExpense {
  id: string;
  description: string;
  amount: number;
  expense_date: string;
  category: string;
  expense_source: string | null;
  booking_id: string | null;
  staff_id: string | null;
  staff_name?: string;
  is_invoiced: boolean;
  status: string;
}

export interface EligibleExpensesResult {
  bookingExpenses: EligibleExpense[];
  travelExpenses: EligibleExpense[];
  otherExpenses: EligibleExpense[];
  allExpenses: EligibleExpense[];
}

export function useEligibleInvoiceExpenses(
  clientId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['eligible-invoice-expenses', clientId, startDate, endDate],
    queryFn: async (): Promise<EligibleExpensesResult> => {
      if (!clientId) {
        return { bookingExpenses: [], travelExpenses: [], otherExpenses: [], allExpenses: [] };
      }

      let query = supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          expense_date,
          category,
          expense_source,
          booking_id,
          staff_id,
          is_invoiced,
          status,
          staff:staff_id (
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'approved');

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('expense_date', startDate);
      }
      if (endDate) {
        query = query.lte('expense_date', endDate);
      }

      query = query.order('expense_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching eligible expenses:', error);
        throw error;
      }

      // Transform and categorize expenses
      const expenses: EligibleExpense[] = (data || []).map((exp: any) => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        expense_date: exp.expense_date,
        category: exp.category,
        expense_source: exp.expense_source,
        booking_id: exp.booking_id,
        staff_id: exp.staff_id,
        staff_name: exp.staff ? `${exp.staff.first_name || ''} ${exp.staff.last_name || ''}`.trim() : undefined,
        is_invoiced: exp.is_invoiced || false,
        status: exp.status,
      }));

      // Categorize expenses
      const bookingExpenses = expenses.filter(e => e.booking_id);
      const travelExpenses = expenses.filter(e => 
        e.category === 'travel_expenses' || e.category === 'mileage'
      );
      const otherExpenses = expenses.filter(e => 
        !e.booking_id && e.category !== 'travel_expenses' && e.category !== 'mileage'
      );

      return {
        bookingExpenses,
        travelExpenses,
        otherExpenses,
        allExpenses: expenses,
      };
    },
    enabled: !!clientId,
  });
}

// Check if an expense is already linked to any invoice
export function useIsExpenseInvoiced(expenseId?: string) {
  return useQuery({
    queryKey: ['expense-invoiced-check', expenseId],
    queryFn: async () => {
      if (!expenseId) return false;

      const { data, error } = await supabase
        .from('invoice_expense_entries')
        .select('id')
        .eq('expense_id', expenseId)
        .limit(1);

      if (error) {
        console.error('Error checking expense invoice status:', error);
        return false;
      }

      return data && data.length > 0;
    },
    enabled: !!expenseId,
  });
}
