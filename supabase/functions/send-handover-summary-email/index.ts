import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface HandoverSummaryEmailRequest {
  recipientEmail: string;
  recipientName: string;
  clientName: string;
  pdfBase64: string;
  senderName?: string;
  branchName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientEmail, 
      recipientName, 
      clientName, 
      pdfBase64, 
      senderName,
      branchName 
    }: HandoverSummaryEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !clientName || !pdfBase64) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: recipientEmail, clientName, or pdfBase64" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending handover summary email for client ${clientName} to ${recipientEmail}`);

    // Generate current date for the email
    const currentDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    // Create HTML email body
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Handover Summary - ${clientName}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 20px 0;">
              <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Med-Infinite</h1>
                    <p style="color: #bfdbfe; margin: 8px 0 0 0; font-size: 14px;">Care Management System</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 20px;">Handover Summary</h2>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                      Dear ${recipientName || 'Carer'},
                    </p>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
                      Please find attached the handover summary for <strong>${clientName}</strong>. This document contains important information for your upcoming care visit.
                    </p>
                    
                    <!-- Info Box -->
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                      <tr>
                        <td style="background-color: #eff6ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                          <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>Client:</strong> ${clientName}</p>
                          <p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;"><strong>Date:</strong> ${currentDate}</p>
                          ${branchName ? `<p style="color: #1e40af; margin: 8px 0 0 0; font-size: 14px;"><strong>Branch:</strong> ${branchName}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 20px 0;">
                      Please review this document carefully before your visit. If you have any questions or concerns, please contact your branch administrator.
                    </p>
                    
                    ${senderName ? `<p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 20px 0 0 0;">Best regards,<br><strong>${senderName}</strong></p>` : ''}
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 20px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                      This is an automated message from Med-Infinite Care Management System.<br>
                      Please do not reply directly to this email.
                    </p>
                    <p style="color: #94a3b8; font-size: 11px; margin: 12px 0 0 0; text-align: center;">
                      © ${new Date().getFullYear()} Med-Infinite. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email with PDF attachment
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.care>",
      to: [recipientEmail],
      subject: `Handover Summary - ${clientName}`,
      html: htmlContent,
      attachments: [
        {
          filename: `Handover_Summary_${clientName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    console.log("Handover summary email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Handover summary sent successfully",
        emailId: emailResponse.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-handover-summary-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
