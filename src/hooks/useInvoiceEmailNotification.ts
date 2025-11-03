import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface EmailSettings {
  id?: string;
  client_id: string;
  send_invoice_emails: boolean;
  email_on_generation: boolean;
  email_on_due_date_reminder: boolean;
  reminder_days_before: number;
  invoice_email?: string;
  cc_emails?: string[];
}

export interface EmailQueueItem {
  id: string;
  invoice_id: string;
  client_id: string;
  recipient_email: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  scheduled_at: string;
  sent_at?: string;
  failed_at?: string;
  retry_count: number;
  error_message?: string;
}

// Fetch email settings for a client
export const useClientEmailSettings = (clientId: string) => {
  return useQuery({
    queryKey: ['client-email-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_email_settings')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(clientId),
  });
};

// Update or create email settings
export const useUpdateEmailSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: EmailSettings) => {
      const { data, error } = await supabase
        .from('client_email_settings')
        .upsert({
          client_id: settings.client_id,
          send_invoice_emails: settings.send_invoice_emails,
          email_on_generation: settings.email_on_generation,
          email_on_due_date_reminder: settings.email_on_due_date_reminder,
          reminder_days_before: settings.reminder_days_before,
          invoice_email: settings.invoice_email,
          cc_emails: settings.cc_emails,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-email-settings', variables.client_id] });
      toast.success('Email settings updated successfully');
    },
    onError: (error) => {
      console.error('[useUpdateEmailSettings] Error:', error);
      toast.error('Failed to update email settings');
    },
  });
};

// Queue invoice emails
export const useQueueInvoiceEmails = () => {
  return useMutation({
    mutationFn: async ({ invoiceIds, batchId }: { invoiceIds: string[]; batchId: string }) => {
      let queuedCount = 0;
      let skippedCount = 0;

      for (const invoiceId of invoiceIds) {
        // Fetch invoice and client details
        const { data: invoice, error: invoiceError } = await supabase
          .from('client_billing')
          .select(`
            id,
            invoice_number,
            invoice_date,
            due_date,
            total_amount,
            client_id,
            clients (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', invoiceId)
          .single();

        if (invoiceError || !invoice) {
          console.error(`[queueInvoiceEmails] Failed to fetch invoice ${invoiceId}:`, invoiceError);
          skippedCount++;
          continue;
        }

        // Check client email settings
        const { data: settings } = await supabase
          .from('client_email_settings')
          .select('*')
          .eq('client_id', invoice.client_id)
          .maybeSingle();

        // Skip if email notifications are disabled
        if (settings && !settings.send_invoice_emails) {
          skippedCount++;
          continue;
        }

        // Determine recipient email
        const recipientEmail = settings?.invoice_email || invoice.clients?.email;

        if (!recipientEmail) {
          console.warn(`[queueInvoiceEmails] No email found for client ${invoice.client_id}`);
          skippedCount++;
          continue;
        }

        // Queue the email
        const { error: queueError } = await supabase
          .from('invoice_email_queue')
          .insert({
            invoice_id: invoiceId,
            client_id: invoice.client_id,
            recipient_email: recipientEmail,
            subject: `Invoice ${invoice.invoice_number} - Ready for Review`,
            template_name: 'invoice_generated',
            template_data: {
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date,
              total_amount: invoice.total_amount,
              client_name: `${invoice.clients?.first_name} ${invoice.clients?.last_name}`,
              batch_id: batchId,
            },
          });

        if (queueError) {
          console.error(`[queueInvoiceEmails] Failed to queue email for invoice ${invoiceId}:`, queueError);
          skippedCount++;
          continue;
        }

        queuedCount++;
      }

      return { queued: queuedCount, skipped: skippedCount };
    },
    onError: (error) => {
      console.error('[useQueueInvoiceEmails] Error:', error);
      toast.error('Failed to queue invoice emails');
    },
  });
};

// Fetch email queue for an invoice
export const useInvoiceEmailQueue = (invoiceId: string) => {
  return useQuery({
    queryKey: ['invoice-email-queue', invoiceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_email_queue')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('scheduled_at', { ascending: false });

      if (error) throw error;
      return data as EmailQueueItem[];
    },
    enabled: Boolean(invoiceId),
  });
};
