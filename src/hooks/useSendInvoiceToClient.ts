import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SendInvoiceToClientParams {
  invoiceId: string;
  branchId?: string;
}

/**
 * Creates a notification for the client when an invoice is sent.
 * Checks for existing notifications to prevent duplicates.
 */
const createClientInvoiceNotification = async (
  invoiceId: string,
  invoiceNumber: string,
  clientId: string,
  branchId?: string | null
) => {
  try {
    // Get the client's auth_user_id
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('auth_user_id, branch_id')
      .eq('id', clientId)
      .single();

    if (clientError || !clientData?.auth_user_id) {
      console.warn('Could not find client auth_user_id for notification:', clientError);
      return;
    }

    // Check if notification already exists for this invoice
    const { data: existingNotification } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', clientData.auth_user_id)
      .eq('data->>invoice_id', invoiceId)
      .maybeSingle();

    if (existingNotification) {
      console.log('Notification already exists for this invoice, skipping');
      return;
    }

    // Create the notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: clientData.auth_user_id,
        branch_id: branchId || clientData.branch_id,
        type: 'client',
        category: 'info',
        priority: 'medium',
        title: 'New Invoice Available',
        message: `Invoice ${invoiceNumber} is ready for your review and payment.`,
        data: {
          notification_type: 'invoice_generated',
          invoice_id: invoiceId,
          invoice_number: invoiceNumber,
          action_url: '/payments'
        }
      });

    if (notificationError) {
      console.error('Error creating invoice notification:', notificationError);
    } else {
      console.log('Invoice notification created successfully for client');
    }
  } catch (error) {
    console.error('Failed to create client invoice notification:', error);
  }
};

/**
 * Hook to send an invoice to the client portal.
 * Updates sent_date and status to make the invoice visible to the client.
 * Also creates a notification for the client.
 */
export const useSendInvoiceToClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, branchId }: SendInvoiceToClientParams) => {
      // First check if already sent
      const { data: existingInvoice, error: checkError } = await supabase
        .from('client_billing')
        .select('id, sent_date, status, invoice_number, client_id')
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
        return { ...data, isResend: true, client_id: existingInvoice.client_id };
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
      return { ...data, isResend: false, client_id: existingInvoice.client_id };
    },
    onSuccess: async (data, variables) => {
      const action = data.isResend ? 'resent' : 'sent';
      toast.success(`Invoice ${action} to client successfully`, {
        description: `Invoice ${data.invoice_number} is now visible on the client portal.`,
      });

      // Create notification for first-time sends only
      if (!data.isResend && data.client_id) {
        await createClientInvoiceNotification(
          data.id,
          data.invoice_number,
          data.client_id,
          variables.branchId
        );
      }

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
