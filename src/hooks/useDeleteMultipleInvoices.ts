import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DeleteMultipleInvoicesPayload {
  invoiceIds: string[];
  invoices: Array<{
    id: string;
    clientId: string;
    invoiceNumber: string;
  }>;
}

export interface DeleteResult {
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}

const deleteMultipleInvoices = async (
  payload: DeleteMultipleInvoicesPayload
): Promise<DeleteResult> => {
  const { invoiceIds, invoices } = payload;
  const result: DeleteResult = {
    successful: [],
    failed: [],
  };

  for (const invoiceId of invoiceIds) {
    try {
      const { error } = await supabase
        .from('client_billing')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      
      result.successful.push(invoiceId);
    } catch (error: any) {
      const invoice = invoices.find(inv => inv.id === invoiceId);
      result.failed.push({
        id: invoiceId,
        error: error.message || 'Unknown error',
      });
      console.error(`Failed to delete invoice ${invoice?.invoiceNumber || invoiceId}:`, error);
    }
  }

  return result;
};

export const useDeleteMultipleInvoices = (branchId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMultipleInvoices,
    onSuccess: async (result, variables) => {
      const { successful, failed } = result;
      const total = variables.invoiceIds.length;

      // ✅ Use refetchQueries for immediate table update
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['branch-invoices', branchId], type: 'active' }),
        queryClient.refetchQueries({ queryKey: ['branch-invoice-stats', branchId], type: 'active' })
      ]);

      // Refetch client billing for affected clients
      const affectedClientIds = new Set(
        variables.invoices
          .filter(inv => successful.includes(inv.id))
          .map(inv => inv.clientId)
      );
      
      for (const clientId of affectedClientIds) {
        await queryClient.refetchQueries({ queryKey: ['client-billing', clientId], type: 'active' });
      }

      // Show appropriate toast notification
      if (failed.length === 0) {
        toast({
          title: 'Success',
          description: `Successfully deleted ${successful.length} invoice${successful.length > 1 ? 's' : ''}!`,
        });
      } else if (successful.length === 0) {
        toast({
          title: 'Error',
          description: 'Failed to delete all invoices. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Partial Success',
          description: `Deleted ${successful.length} of ${total} invoices. ${failed.length} could not be deleted.`,
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('[useDeleteMultipleInvoices] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoices. Please try again.',
        variant: 'destructive',
      });
    },
  });
};
