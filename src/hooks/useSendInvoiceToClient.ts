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
 * Also validates service payer configuration and auto-sets bill_to_type.
 */
export const useSendInvoiceToClient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ invoiceId, branchId }: SendInvoiceToClientParams) => {
      // Fetch invoice with client's service payer setting
      const { data: existingInvoice, error: checkError } = await supabase
        .from('client_billing')
        .select(`
          id, 
          sent_date, 
          status, 
          invoice_number, 
          client_id, 
          bill_to_type
        `)
        .eq('id', invoiceId)
        .single();

      if (checkError) throw checkError;

      // Fetch service payer setting for the client
      const { data: accountingSettings, error: settingsError } = await supabase
        .from('client_accounting_settings')
        .select('service_payer')
        .eq('client_id', existingInvoice.client_id)
        .maybeSingle();

      if (settingsError) {
        console.error('Error fetching accounting settings:', settingsError);
      }

      const servicePayer = accountingSettings?.service_payer;

      // Validate service payer is configured
      if (!servicePayer) {
        throw new Error("Cannot send invoice: 'Who pays for the service' is not configured for this client. Please configure this in Client → General → Accounting Settings.");
      }

      // Auto-set bill_to_type based on service payer if not already set
      let billToType = existingInvoice.bill_to_type;
      if (!billToType) {
        if (servicePayer === 'self_funder') {
          billToType = 'private';
        } else if (servicePayer === 'authorities') {
          billToType = 'authority';
        } else {
          // direct_payment, other - default to private
          billToType = 'private';
        }
      }

      // Check if already sent (has sent_date)
      if (existingInvoice.sent_date) {
        // This is a resend - just update sent_date and ensure bill_to_type is set
        const { data, error } = await supabase
          .from('client_billing')
          .update({
            sent_date: new Date().toISOString(),
            bill_to_type: billToType,
          })
          .eq('id', invoiceId)
          .select()
          .single();

        if (error) throw error;
        return { ...data, isResend: true, client_id: existingInvoice.client_id };
      }

      // First time sending - update status, sent_date, and bill_to_type
      const { data, error } = await supabase
        .from('client_billing')
        .update({
          sent_date: new Date().toISOString(),
          status: 'sent',
          bill_to_type: billToType,
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
