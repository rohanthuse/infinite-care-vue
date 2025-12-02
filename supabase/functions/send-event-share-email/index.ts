import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventShareEmailRequest {
  recipientEmail: string;
  eventTitle: string;
  eventSummary: {
    eventType: string;
    severity: string;
    eventDate: string;
    clientName: string;
    location?: string;
    description?: string;
  };
  pdfBase64: string;
  organizationName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      eventTitle, 
      eventSummary, 
      pdfBase64, 
      organizationName 
    }: EventShareEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !eventTitle || !pdfBase64) {
      console.error("Missing required fields:", { recipientEmail: !!recipientEmail, eventTitle: !!eventTitle, pdfBase64: !!pdfBase64 });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error("Invalid email format:", recipientEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Sending event share email to:", recipientEmail);
    console.log("Event title:", eventTitle);
    console.log("Organization:", organizationName);

    // Build email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 15px; margin-bottom: 20px; }
            .summary { background-color: #f9fafb; border-radius: 8px; padding: 15px; margin: 20px 0; }
            .summary-item { margin: 8px 0; }
            .label { font-weight: bold; color: #6b7280; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e5e5; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="margin: 0; color: #111827;">Event Details Report</h2>
            </div>
            
            <p>Hello,</p>
            <p>Please find attached the Event Details Report.</p>
            
            ${eventSummary ? `
            <div class="summary">
              <h3 style="margin-top: 0; color: #374151;">Event Summary</h3>
              <div class="summary-item"><span class="label">Event Type:</span> ${eventSummary.eventType || 'N/A'}</div>
              <div class="summary-item"><span class="label">Severity:</span> ${eventSummary.severity || 'N/A'}</div>
              <div class="summary-item"><span class="label">Date:</span> ${eventSummary.eventDate || 'N/A'}</div>
              <div class="summary-item"><span class="label">Client:</span> ${eventSummary.clientName || 'N/A'}</div>
              ${eventSummary.location ? `<div class="summary-item"><span class="label">Location:</span> ${eventSummary.location}</div>` : ''}
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Regards,<br><strong>${organizationName || 'Care Management System'}</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Care Management <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: `Event Details Report – ${eventTitle}`,
      html: emailHtml,
      attachments: [
        {
          filename: `${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-share-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
