import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvoiceToClientParams {
  invoiceId: string;
  branchId?: string;
}

/**
 * Hook to send an invoice to the client portal.
 * Updates sent_date and status to make the invoice visible to the client.
 */
export const useSendInvoiceToClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId }: SendInvoiceToClientParams) => {
      // First check if already sent
      const { data: existingInvoice, error: checkError } = await supabase
        .from('client_billing')
        .select('id, sent_date, status, invoice_number')
        .eq('id', invoiceId)
        .single();

      if (checkError) throw checkError;

      // Check if already sent (has sent_date)
      if (existingInvoice.sent_date) {
        // This is a resend - just update sent_date
        const { data, error } = await supabase
          .from('client_billing')
          .update({
            sent_date: new Date().toISOString(),
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (error) throw error;
        return { ...data, isResend: true };
      }

      // First time sending - update status and sent_date
      const { data, error } = await supabase
        .from('client_billing')
        .update({
          sent_date: new Date().toISOString(),
          status: 'sent',
        })
        .eq('id', invoiceId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, isResend: false };
    },
    onSuccess: (data, variables) => {
      const action = data.isResend ? 'resent' : 'sent';
      toast.success(`Invoice ${action} to client successfully`, {
        description: `Invoice ${data.invoice_number} is now visible on the client portal.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['client-portal-invoices'] });
    },
    onError: (error: Error) => {
      console.error('Error sending invoice to client:', error);
      toast.error('Failed to send invoice to client', {
        description: error.message,
      });
    },
  });
};
