import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from '@/hooks/useCarerProfile';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export interface VisitExpenseData {
  booking_id: string;
  client_id: string;
  expense_type_id: string;
  expense_date: string;
  amount: number;
  description: string;
  receipt_file?: File;
  metadata?: Record<string, unknown>;
}

export function useVisitExpenseSubmission() {
  const { data: carerProfile } = useCarerProfile();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expenseData: VisitExpenseData) => {
      if (!carerProfile?.branch_id || !carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Handle receipt file upload if provided
      let receipt_url: string | undefined;
      if (expenseData.receipt_file) {
        const fileExt = expenseData.receipt_file.name.split('.').pop();
        const fileName = `${carerProfile.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('expense-receipts')
          .upload(fileName, expenseData.receipt_file);
        
        if (uploadError) {
          console.error('Receipt upload error:', uploadError);
          // Continue without receipt if upload fails
        } else {
          receipt_url = fileName;
        }
      }

      const expense = {
        branch_id: carerProfile.branch_id,
        staff_id: carerProfile.id,
        client_id: expenseData.client_id,
        booking_id: expenseData.booking_id,
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.expense_type_id,
        expense_date: expenseData.expense_date,
        payment_method: 'reimbursement',
        status: 'pending',
        receipt_url,
        created_by: carerProfile.id,
        is_invoiced: false,
        metadata: (expenseData.metadata || {}) as Json,
        expense_source: 'past_booking',
      };

      console.log('[useVisitExpenseSubmission] Submitting expense:', expense);
      
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();

      if (error) throw error;

      // Trigger notification for admins
      try {
        const clientName = expenseData.metadata?.client_name as string || undefined;
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'submitted',
            expense_id: data.id,
            staff_id: carerProfile.id,
            staff_name: `${carerProfile.first_name || ''} ${carerProfile.last_name || ''}`.trim(),
            branch_id: carerProfile.branch_id,
            expense_source: 'past_booking',
            expense_type: expenseData.expense_type_id,
            amount: expenseData.amount,
            client_name: clientName,
            booking_id: expenseData.booking_id
          }
        });
      } catch (notifyError) {
        console.error('[useVisitExpenseSubmission] Failed to send notification:', notifyError);
        // Don't throw - expense was created successfully
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['my-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Expense submitted successfully', {
        description: 'Your expense claim is pending approval'
      });
    },
    onError: (error: Error) => {
      console.error('[useVisitExpenseSubmission] Error:', error);
      toast.error('Failed to submit expense', {
        description: error.message
      });
    },
  });
}
