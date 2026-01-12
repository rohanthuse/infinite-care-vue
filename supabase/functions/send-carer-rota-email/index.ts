import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CarerRotaEmailRequest {
  carerName: string;
  carerEmail: string;
  branchName: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  bookingsCount: number;
  totalHours: string;
  pdfBase64: string;
  pdfFileName: string;
  senderName: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-carer-rota-email] Function invoked");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CarerRotaEmailRequest = await req.json();
    console.log("[send-carer-rota-email] Request data:", {
      carerName: requestData.carerName,
      carerEmail: requestData.carerEmail,
      branchName: requestData.branchName,
      dateRange: requestData.dateRange,
      bookingsCount: requestData.bookingsCount,
      totalHours: requestData.totalHours,
      pdfFileName: requestData.pdfFileName,
      senderName: requestData.senderName,
    });

    const { 
      carerName, 
      carerEmail, 
      branchName, 
      dateRange, 
      bookingsCount, 
      totalHours, 
      pdfBase64, 
      pdfFileName,
      senderName 
    } = requestData;

    // Validation
    if (!carerEmail) {
      console.error("[send-carer-rota-email] Missing carer email");
      return new Response(
        JSON.stringify({ error: "Carer email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!pdfBase64) {
      console.error("[send-carer-rota-email] Missing PDF data");
      return new Response(
        JSON.stringify({ error: "PDF data is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(carerEmail)) {
      console.error("[send-carer-rota-email] Invalid email format:", carerEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Format date range for display
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    const dateRangeDisplay = `${startDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })} - ${endDate.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })}`;

    // Build email content
    const emailContent = `
      <h2 style="color: #1f2937; margin-bottom: 24px; font-size: 24px;">Your Rota Schedule</h2>
      
      <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
        Dear <strong>${carerName}</strong>,
      </p>
      
      <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
        Please find attached your rota schedule for the period <strong>${dateRangeDisplay}</strong>.
      </p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 16px; font-size: 16px;">Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Branch:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 500; font-size: 14px; text-align: right;">${branchName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Period:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 500; font-size: 14px; text-align: right;">${dateRangeDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Bookings:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 500; font-size: 14px; text-align: right;">${bookingsCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Total Hours:</td>
            <td style="padding: 8px 0; color: #1f2937; font-weight: 500; font-size: 14px; text-align: right;">${totalHours}h</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 16px; color: #374151; margin-bottom: 16px;">
        The detailed schedule is attached as a PDF document for your reference.
      </p>
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
        Sent by ${senderName} from ${branchName}
      </p>
    `;

    const emailHtml = generateMedInfiniteEmailHTML({
      title: `Your Rota Schedule - ${dateRangeDisplay}`,
      previewText: `Your rota schedule for ${dateRangeDisplay} - ${bookingsCount} bookings, ${totalHours} hours`,
      content: emailContent,
      footerText: "If you have any questions about your schedule, please contact your branch administrator.",
    });

    console.log("[send-carer-rota-email] Sending email to:", carerEmail);

    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.care>",
      to: [carerEmail],
      subject: `Your Rota Schedule - ${dateRangeDisplay}`,
      html: emailHtml,
      attachments: [
        {
          filename: pdfFileName || "Carer_Rota.pdf",
          content: pdfBase64,
        },
      ],
    });

    console.log("[send-carer-rota-email] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-carer-rota-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
