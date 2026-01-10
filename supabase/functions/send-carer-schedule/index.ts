import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingScheduleItem {
  date: string;
  time: string;
  clientName: string;
  clientAddress: string;
  services: string[];
  duration: number;
  status: string;
}

interface CarerScheduleEmailRequest {
  carerName: string;
  carerEmail: string;
  branchName: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  bookings: BookingScheduleItem[];
  senderName: string;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const getStatusBadgeColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || 'assigned';
  const colors: Record<string, string> = {
    'done': '#3b82f6',        // blue-500
    'completed': '#3b82f6',   // blue-500
    'missed': '#ef4444',      // red-500
    'in_progress': '#8b5cf6', // purple-500
    'in-progress': '#8b5cf6', // purple-500
    'assigned': '#22c55e',    // green-500
    'cancelled': '#f43f5e',   // rose-500 (changed from red)
    'departed': '#14b8a6',    // teal-500
    'suspended': '#6b7280',   // gray-500
    'unassigned': '#eab308',  // yellow-500
    'late': '#f97316',        // orange-500
    'training': '#f59e0b',    // amber-500
  };
  return colors[statusLower] || '#6b7280';
};

const handler = async (req: Request): Promise<Response> => {
  console.log("[send-carer-schedule] Function invoked");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CarerScheduleEmailRequest = await req.json();
    console.log("[send-carer-schedule] Request data:", {
      carerName: requestData.carerName,
      carerEmail: requestData.carerEmail,
      branchName: requestData.branchName,
      dateRange: requestData.dateRange,
      bookingsCount: requestData.bookings?.length || 0,
    });

    const { carerName, carerEmail, branchName, dateRange, bookings, senderName } = requestData;

    if (!carerEmail) {
      console.error("[send-carer-schedule] Missing carer email");
      return new Response(
        JSON.stringify({ error: "Carer email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate total hours
    const totalMinutes = bookings.reduce((sum, b) => sum + (b.duration || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

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

    // Generate bookings table rows
    const bookingRows = bookings.map(booking => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${booking.date}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${booking.time}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #374151; font-weight: 500;">${booking.clientName}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #6b7280;">${booking.clientAddress || 'No address'}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${booking.services?.join(', ') || 'N/A'}</td>
        <td style="padding: 12px 8px; font-size: 14px; color: #374151;">${formatDuration(booking.duration)}</td>
        <td style="padding: 12px 8px;">
          <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; color: white; background-color: ${getStatusBadgeColor(booking.status)};">
            ${booking.status || 'Assigned'}
          </span>
        </td>
      </tr>
    `).join('');

    const emailContent = `
      <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">Dear ${carerName},</p>
      
      <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
        Here is your booking schedule for <strong>${dateRangeDisplay}</strong>:
      </p>
      
      <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; gap: 32px;">
          <div>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Total Bookings</p>
            <p style="font-size: 24px; font-weight: 600; color: #2563eb; margin: 4px 0;">${bookings.length}</p>
          </div>
          <div>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">Total Hours</p>
            <p style="font-size: 24px; font-weight: 600; color: #2563eb; margin: 4px 0;">${totalHours}h</p>
          </div>
        </div>
      </div>
      
      ${bookings.length > 0 ? `
        <div style="overflow-x: auto; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; min-width: 700px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Date</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Time</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Client</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Address</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Service(s)</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Duration</th>
                <th style="padding: 12px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${bookingRows}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="font-size: 14px; color: #92400e; margin: 0;">No bookings found for this date range.</p>
        </div>
      `}
      
      <p style="font-size: 14px; color: #6b7280; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        This schedule was sent by <strong>${senderName}</strong> from <strong>${branchName}</strong>.
      </p>
      
      <p style="font-size: 14px; color: #6b7280;">
        If you have any questions about your schedule, please contact your branch administrator.
      </p>
    `;

    const html = generateMedInfiniteEmailHTML({
      title: `Your Booking Schedule - ${dateRangeDisplay}`,
      previewText: `Your booking schedule for ${dateRangeDisplay} - ${bookings.length} bookings, ${totalHours} hours total`,
      content: emailContent,
      footerText: 'This schedule was automatically generated. Please do not reply directly to this message.',
    });

    console.log("[send-carer-schedule] Sending email to:", carerEmail);
    
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <onboarding@resend.dev>",
      to: [carerEmail],
      subject: `Your Booking Schedule - ${dateRangeDisplay}`,
      html,
    });

    console.log("[send-carer-schedule] Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-carer-schedule] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
