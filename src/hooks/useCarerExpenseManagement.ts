
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCreateExpense } from '@/hooks/useAccountingData';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { toast } from 'sonner';

export interface CreateExpenseData {
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_file?: File;
  notes?: string;
}

export function useCarerExpenseManagement() {
  const { data: carerProfile } = useCarerProfile();
  const queryClient = useQueryClient();
  const createExpenseMutation = useCreateExpense();

  const submitExpense = useMutation({
    mutationFn: async (expenseData: CreateExpenseData) => {
      if (!carerProfile?.branch_id || !carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // TODO: Implement file upload to Supabase storage for receipt
      let receipt_url: string | undefined;
      
      if (expenseData.receipt_file) {
        // For now, we'll store the filename - in a full implementation,
        // this would upload to Supabase storage and return the URL
        receipt_url = `receipts/${carerProfile.id}/${Date.now()}_${expenseData.receipt_file.name}`;
      }

      const expense = {
        branch_id: carerProfile.branch_id,
        staff_id: carerProfile.id,
        client_id: null,
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        expense_date: expenseData.expense_date,
        payment_method: 'reimbursement',
        status: 'pending',
        receipt_url,
        notes: expenseData.notes,
        created_by: carerProfile.id,
        // organization_id will be automatically set by the database trigger
      };

      console.log('Submitting expense:', expense);
      return createExpenseMutation.mutateAsync(expense);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
    },
    onError: (error: Error) => {
      console.error('Expense submission error:', error);
      toast.error('Failed to submit expense claim', {
        description: error.message
      });
    },
  });

  return {
    submitExpense,
    isSubmitting: submitExpense.isPending,
  };
}
