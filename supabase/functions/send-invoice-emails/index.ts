import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch pending emails (limit to 50 per run)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('invoice_email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', 3)
      .order('scheduled_at', { ascending: true })
      .limit(50);

    if (fetchError) throw fetchError;

    console.log(`Processing ${pendingEmails?.length || 0} pending emails`);

    let successCount = 0;
    let failCount = 0;

    for (const email of pendingEmails || []) {
      try {
        // Fetch invoice and organization details
        const { data: invoice, error: invError } = await supabase
          .from('client_billing')
          .select(`
            id,
            invoice_number,
            invoice_date,
            due_date,
            total_amount,
            branch_id,
            branches (
              organization_id,
              organizations (
                name
              )
            )
          `)
          .eq('id', email.invoice_id)
          .single();

        if (invError || !invoice) {
          throw new Error(`Failed to fetch invoice: ${invError?.message}`);
        }

        const templateData = email.template_data || {};
        const organizationName = invoice.branches?.organizations?.name || 'Your Care Provider';

        // Send email using Resend
        const { error: sendError } = await resend.emails.send({
          from: `${organizationName} <onboarding@resend.dev>`,
          to: [email.recipient_email],
          subject: email.subject,
          html: generateInvoiceEmailHTML({
            invoiceNumber: invoice.invoice_number,
            invoiceDate: invoice.invoice_date,
            dueDate: invoice.due_date,
            totalAmount: invoice.total_amount,
            clientName: templateData.client_name,
            organizationName,
          }),
        });

        if (sendError) throw sendError;

        // Update queue status to sent
        await supabase
          .from('invoice_email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', email.id);

        successCount++;
        console.log(`Successfully sent email for invoice ${invoice.invoice_number}`);
      } catch (error: any) {
        console.error(`Failed to send email ${email.id}:`, error);

        // Update queue status to failed or increment retry
        await supabase
          .from('invoice_email_queue')
          .update({
            status: email.retry_count >= 2 ? 'failed' : 'pending',
            retry_count: email.retry_count + 1,
            failed_at: email.retry_count >= 2 ? new Date().toISOString() : undefined,
            error_message: error.message,
          })
          .eq('id', email.id);

        failCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: pendingEmails?.length || 0,
        successful: successCount,
        failed: failCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-emails function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});

// Generate HTML email template
function generateInvoiceEmailHTML(data: {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  clientName: string;
  organizationName: string;
}): string {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background-color: #1e40af; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">New Invoice</h1>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
            Dear ${data.clientName},
          </p>

          <p style="font-size: 16px; color: #374151; margin-bottom: 24px; line-height: 1.6;">
            A new invoice has been generated for your account. Please find the details below:
          </p>

          <!-- Invoice Details Box -->
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Invoice Number</span>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">
                ${data.invoiceNumber}
              </p>
            </div>

            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Invoice Date</span>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">
                ${formatDate(data.invoiceDate)}
              </p>
            </div>

            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Due Date</span>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">
                ${formatDate(data.dueDate)}
              </p>
            </div>

            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Total Amount Due</span>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #1e40af;">
                ${formatCurrency(data.totalAmount)}
              </p>
            </div>
          </div>

          <p style="font-size: 14px; color: #6b7280; line-height: 1.6; margin-bottom: 16px;">
            If you have any questions about this invoice, please don't hesitate to contact us.
          </p>

          <p style="font-size: 16px; color: #374151; margin-bottom: 8px;">
            Best regards,
          </p>
          <p style="font-size: 16px; color: #374151; font-weight: 600;">
            ${data.organizationName}
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px 0;">
            This is an automated email. Please do not reply directly to this message.
          </p>
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            © ${new Date().getFullYear()} ${data.organizationName}. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
