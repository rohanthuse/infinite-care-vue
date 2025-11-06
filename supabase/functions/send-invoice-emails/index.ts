import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
        const clientName = templateData.client_name;

        // Generate branded email content
        const content = `
          <h2 style="color: #1f2937; margin-bottom: 24px;">New Invoice</h2>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Dear ${clientName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            A new invoice has been generated for your account. Please find the details below:
          </p>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Invoice Number</span>
              <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: bold; color: #111827;">
                ${invoice.invoice_number}
              </p>
            </div>
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Invoice Date</span>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">
                ${formatDate(invoice.invoice_date)}
              </p>
            </div>
            <div style="margin-bottom: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Due Date</span>
              <p style="margin: 4px 0 0 0; font-size: 16px; color: #111827;">
                ${formatDate(invoice.due_date)}
              </p>
            </div>
            <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-top: 16px;">
              <span style="color: #6b7280; font-size: 14px;">Total Amount Due</span>
              <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #2563eb;">
                ${formatCurrency(invoice.total_amount)}
              </p>
            </div>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If you have any questions about this invoice, please don't hesitate to contact us.
          </p>
        `;

        const html = generateMedInfiniteEmailHTML({
          title: 'New Invoice from Med-Infinite',
          previewText: `Invoice ${invoice.invoice_number} - ${formatCurrency(invoice.total_amount)}`,
          content,
        });

        // Send email using Resend
        const { error: sendError } = await resend.emails.send({
          from: "Med-Infinite <noreply@med-infinite.care>",
          to: [email.recipient_email],
          subject: email.subject,
          html,
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
