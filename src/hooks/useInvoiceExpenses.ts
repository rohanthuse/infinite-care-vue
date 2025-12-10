import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InvoiceExpenseEntry } from '@/types/invoiceExpense';

// Fetch invoice expense entries for a specific invoice
export function useInvoiceExpenseEntries(invoiceId?: string) {
  return useQuery({
    queryKey: ['invoice-expense-entries', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('invoice_expense_entries')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!invoiceId,
  });
}

// Create invoice expense entries
export function useCreateInvoiceExpenseEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      expenses,
      organizationId 
    }: { 
      invoiceId: string; 
      expenses: InvoiceExpenseEntry[];
      organizationId?: string;
    }) => {
      const expenseEntries = expenses.map(expense => ({
        invoice_id: invoiceId,
        expense_type_id: expense.expense_type_id,
        expense_type_name: expense.expense_type_name,
        date: expense.date,
        amount: expense.amount,
        admin_cost_percentage: expense.admin_cost_percentage,
        description: expense.description,
        pay_staff: expense.pay_staff,
        staff_id: expense.staff_id,
        staff_name: expense.staff_name,
        pay_staff_amount: expense.pay_staff_amount,
        organization_id: organizationId,
      }));

      const { data, error } = await supabase
        .from('invoice_expense_entries')
        .insert(expenseEntries)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-expense-entries'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Expenses added to invoice successfully');
    },
    onError: (error) => {
      console.error('Error adding expenses to invoice:', error);
      toast.error('Failed to add expenses to invoice');
    },
  });
}

// Delete invoice expense entry
export function useDeleteInvoiceExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('invoice_expense_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-expense-entries'] });
      toast.success('Expense entry removed from invoice');
    },
    onError: (error) => {
      console.error('Error removing expense entry:', error);
      toast.error('Failed to remove expense entry');
    },
  });
}

// Calculate expense totals for invoice
export function calculateExpenseTotals(expenses: InvoiceExpenseEntry[]) {
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalStaffPayment = expenses.reduce(
    (sum, exp) => sum + (exp.pay_staff_amount || 0),
    0
  );
  const totalAdminCost = expenses.reduce(
    (sum, exp) => sum + (exp.amount * exp.admin_cost_percentage) / 100,
    0
  );

  return {
    totalAmount,
    totalStaffPayment,
    totalAdminCost,
    count: expenses.length,
  };
}
