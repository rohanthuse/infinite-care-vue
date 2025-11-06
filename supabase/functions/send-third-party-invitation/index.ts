
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

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

    // Generate branded email content
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 24px;">Third-Party Access Invitation</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Dear ${request.first_name} ${request.surname},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        You have been granted access to Med-Infinite's system for <strong>${request.branches?.name}</strong>.
      </p>
      
      <div style="background-color: #f3f4f6; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #2563eb;">
        <h3 style="color: #1f2937; margin: 0 0 16px 0;">Access Details:</h3>
        <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
          <li><strong>Access Type:</strong> ${request.request_for.charAt(0).toUpperCase() + request.request_for.slice(1)} data</li>
          <li><strong>Valid From:</strong> ${new Date(request.access_from).toLocaleDateString('en-GB')}</li>
          <li><strong>Valid Until:</strong> ${request.access_until ? new Date(request.access_until).toLocaleDateString('en-GB') : 'Indefinite'}</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteUrl}" class="button">
          Access Med-Infinite System
        </a>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 12px 0; color: #92400e;">🔒 Security Information:</h4>
        <ul style="margin: 0; color: #92400e; padding-left: 20px; font-size: 14px;">
          <li>This link is unique to you and should not be shared</li>
          <li>Your access is logged and monitored</li>
          <li>Only access the data you need</li>
        </ul>
      </div>
    `;

    const html = generateMedInfiniteEmailHTML({
      title: 'Third-Party Access Invitation',
      previewText: 'You have been granted access to Med-Infinite',
      content,
      footerText: 'If you did not expect this invitation, please ignore it.'
    });

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <onboarding@resend.dev>",
      to: [request.email],
      subject: "Third-Party Access Invitation - Med-Infinite",
      html,
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
