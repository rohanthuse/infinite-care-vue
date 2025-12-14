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

// Create invoice expense entries with duplicate prevention and invoice total update
export function useCreateInvoiceExpenseEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      invoiceId, 
      expenses,
      organizationId,
      sourceExpenseIds = [],
    }: { 
      invoiceId: string; 
      expenses: InvoiceExpenseEntry[];
      organizationId?: string;
      sourceExpenseIds?: string[]; // IDs of source expenses to mark as invoiced
    }) => {
      // Prepare expense entries for insertion
      const expenseEntries = expenses.map(expense => ({
        invoice_id: invoiceId,
        expense_id: expense.expense_id || null,
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

      // Insert expense entries
      const { data: insertedEntries, error: insertError } = await supabase
        .from('invoice_expense_entries')
        .insert(expenseEntries)
        .select();

      if (insertError) throw insertError;

      // Mark source expenses as invoiced if any
      if (sourceExpenseIds.length > 0) {
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ is_invoiced: true })
          .in('id', sourceExpenseIds);

        if (updateError) {
          console.error('Error marking expenses as invoiced:', updateError);
          // Don't throw - entries are already created
        }
      }

      // Calculate total expense amount and update invoice
      const totalExpenseAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      if (totalExpenseAmount > 0) {
        // Get current invoice amount
        const { data: invoiceData, error: fetchError } = await supabase
          .from('client_billing')
          .select('amount, total_amount')
          .eq('id', invoiceId)
          .single();

        if (!fetchError && invoiceData) {
          const currentTotal = invoiceData.total_amount || invoiceData.amount || 0;
          const newTotal = currentTotal + totalExpenseAmount;

          // Update invoice total
          const { error: updateInvoiceError } = await supabase
            .from('client_billing')
            .update({ total_amount: newTotal })
            .eq('id', invoiceId);

          if (updateInvoiceError) {
            console.error('Error updating invoice total:', updateInvoiceError);
          }
        }
      }

      return insertedEntries;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-expense-entries'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-invoice-expenses'] });
      toast.success('Expenses added to invoice successfully');
    },
    onError: (error) => {
      console.error('Error adding expenses to invoice:', error);
      toast.error('Failed to add expenses to invoice');
    },
  });
}

// Delete invoice expense entry with total recalculation
export function useDeleteInvoiceExpenseEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, invoiceId }: { entryId: string; invoiceId: string }) => {
      // Get the expense entry first to know the amount and source expense ID
      const { data: entry, error: fetchError } = await supabase
        .from('invoice_expense_entries')
        .select('amount, expense_id')
        .eq('id', entryId)
        .single();

      if (fetchError) throw fetchError;

      // Delete the entry
      const { error: deleteError } = await supabase
        .from('invoice_expense_entries')
        .delete()
        .eq('id', entryId);

      if (deleteError) throw deleteError;

      // If linked to source expense, mark it as not invoiced
      if (entry?.expense_id) {
        await supabase
          .from('expenses')
          .update({ is_invoiced: false })
          .eq('id', entry.expense_id);
      }

      // Update invoice total
      if (entry?.amount) {
        const { data: invoiceData } = await supabase
          .from('client_billing')
          .select('total_amount')
          .eq('id', invoiceId)
          .single();

        if (invoiceData) {
          const newTotal = Math.max(0, (invoiceData.total_amount || 0) - entry.amount);
          await supabase
            .from('client_billing')
            .update({ total_amount: newTotal })
            .eq('id', invoiceId);
        }
      }

      return { entryId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-expense-entries'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-invoice-expenses'] });
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
