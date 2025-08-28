import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMarkExpenseAsReimbursed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ expenseId }: { expenseId: string }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({ 
          status: 'reimbursed',
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
      toast.success('Expense marked as reimbursed successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to mark expense as reimbursed:', error);
      toast.error('Failed to mark expense as reimbursed', {
        description: error.message
      });
    },
  });
};