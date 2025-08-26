
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  requestId: string;
  inviteToken: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { requestId, inviteToken }: InvitationRequest = await req.json();

    // Get request details from database
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: request, error } = await supabase
      .from('third_party_access_requests')
      .select(`
        *,
        branches:branch_id (name)
      `)
      .eq('id', requestId)
      .single();

    if (error || !request) {
      throw new Error('Request not found');
    }

    // Create invitation link using the main login page with third-party token
    const inviteUrl = `${Deno.env.get("SITE_URL")}/login?thirdPartyToken=${inviteToken}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.com>",
      to: [request.email],
      subject: "Third-Party Access Invitation - Med-Infinite",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; text-align: center;">Med-Infinite</h1>
          <h2>Third-Party Access Invitation</h2>
          
          <p>Dear ${request.first_name} ${request.surname},</p>
          
          <p>You have been granted access to Med-Infinite's system for <strong>${request.branches?.name}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Access Details:</h3>
            <ul>
              <li><strong>Access Type:</strong> ${request.request_for.charAt(0).toUpperCase() + request.request_for.slice(1)} data</li>
              <li><strong>Valid From:</strong> ${new Date(request.access_from).toLocaleDateString()}</li>
              <li><strong>Valid Until:</strong> ${request.access_until ? new Date(request.access_until).toLocaleDateString() : 'Indefinite'}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Med-Infinite System
            </a>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 10px 0; color: #92400e;">Important Security Information:</h4>
            <ul style="margin: 0; color: #92400e;">
              <li>This link is unique to you and should not be shared</li>
              <li>Your access is logged and monitored for security purposes</li>
              <li>Only access the data you need for your specific purpose</li>
              <li>Contact the branch administrator if you have any questions</li>
            </ul>
          </div>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            This invitation was generated automatically. If you did not expect this email, please ignore it.
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 12px; color: #9ca3af; text-align: center;">
            Med-Infinite Healthcare Management System<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      `,
    });

    // Update request with sent timestamp
    await supabase
      .from('third_party_access_requests')
      .update({ invite_sent_at: new Date().toISOString() })
      .eq('id', requestId);

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-third-party-invitation function:", error);
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
