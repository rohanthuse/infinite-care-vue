import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';
import { toast } from 'sonner';

export const useCarerExpenseDelete = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // First verify the expense belongs to this carer and is pending
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('id, staff_id, status')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;
      if (!expense) throw new Error('Expense not found');
      if (expense.staff_id !== carerProfile.id) throw new Error('Unauthorized');
      if (expense.status !== 'pending') throw new Error('Only pending expenses can be deleted');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to delete expense', { description: error.message });
    },
  });

  return { deleteExpense };
};
