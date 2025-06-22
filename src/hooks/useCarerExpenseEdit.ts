
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCarerAuth } from '@/hooks/useCarerAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UpdateExpenseData {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  receipt_file?: File;
  notes?: string;
}

export function useCarerExpenseEdit() {
  const { carerProfile } = useCarerAuth();
  const queryClient = useQueryClient();

  const updateExpense = useMutation({
    mutationFn: async (expenseData: UpdateExpenseData) => {
      if (!carerProfile?.branch_id || !carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Check if expense can be edited (only pending expenses)
      const { data: currentExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('status, staff_id')
        .eq('id', expenseData.id)
        .single();

      if (fetchError) {
        throw new Error('Failed to fetch expense details');
      }

      if (currentExpense.status !== 'pending') {
        throw new Error('Only pending expenses can be edited');
      }

      if (currentExpense.staff_id !== carerProfile.id) {
        throw new Error('You can only edit your own expenses');
      }

      // TODO: Implement file upload to Supabase storage for receipt
      let receipt_url: string | undefined;
      
      if (expenseData.receipt_file) {
        // For now, we'll store the filename - in a full implementation,
        // this would upload to Supabase storage and return the URL
        receipt_url = `receipts/${carerProfile.id}/${Date.now()}_${expenseData.receipt_file.name}`;
      }

      const updateData: any = {
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        expense_date: expenseData.expense_date,
        notes: expenseData.notes,
        updated_at: new Date().toISOString(),
      };

      // Only update receipt_url if a new file was provided
      if (receipt_url) {
        updateData.receipt_url = receipt_url;
      }

      const { data, error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expenseData.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update expense', {
        description: error.message
      });
    },
  });

  return {
    updateExpense,
    isUpdating: updateExpense.isPending,
  };
}
