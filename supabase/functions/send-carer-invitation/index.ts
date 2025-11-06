
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CarerInvitationRequest {
  staff_id: string;
  email: string;
  first_name: string;
  last_name: string;
  invitation_token: string;
  branch_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[send-carer-invitation] Function called');

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  try {
    const { staff_id, email, first_name, last_name, invitation_token, branch_name }: CarerInvitationRequest = await req.json();

    console.log('[send-carer-invitation] Sending invitation to:', email, 'for staff:', staff_id);

    // Create the invitation URL using proper site URL
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'med-infinite.care') || 'https://med-infinite.care';
    const invitationUrl = `${siteUrl}/carer-invitation?token=${invitation_token}`;

    // Generate branded email content
    const content = `
      <h2 style="color: #1f2937; margin-bottom: 24px;">Welcome to Med-Infinite!</h2>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        Dear ${first_name},
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        You have been invited to join <strong>${branch_name}</strong> as a carer on Med-Infinite Healthcare Management System.
      </p>
      
      <p style="color: #374151; font-size: 16px; line-height: 1.6;">
        To complete your account setup and start your journey with us, please click the button below to create your password and access your carer dashboard.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${invitationUrl}" class="button">
          Accept Invitation & Set Password
        </a>
      </div>
      
      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 24px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>⏰ Important:</strong> This invitation link will expire in 7 days. Please complete your account setup as soon as possible.
        </p>
      </div>
      
      <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <h3 style="color: #1e40af; margin: 0 0 16px 0;">What's next after you accept:</h3>
        <ul style="color: #1e40af; margin: 0; padding-left: 20px; font-size: 14px;">
          <li>Set up your secure password</li>
          <li>Complete your carer profile</li>
          <li>Access your personalized dashboard</li>
          <li>Start managing your care assignments</li>
        </ul>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
        If the button doesn't work, copy and paste this link: <br>
        <span style="color: #2563eb; word-break: break-all;">${invitationUrl}</span>
      </p>
    `;

    const html = generateMedInfiniteEmailHTML({
      title: 'Welcome to Med-Infinite',
      previewText: `${first_name}, you've been invited to join ${branch_name}`,
      content,
    });

    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.care>",
      to: [email],
      subject: "Welcome to Med-Infinite - Complete Your Carer Account Setup",
      html,
    });

    if (emailResponse.error) {
      console.error('[send-carer-invitation] Email sending failed:', emailResponse.error);
      throw new Error(`Email sending failed: ${emailResponse.error.message}`);
    }

    console.log('[send-carer-invitation] Email sent successfully:', emailResponse.data?.id);

    return new Response(JSON.stringify({
      success: true,
      message: "Invitation email sent successfully",
      email_id: emailResponse.data?.id
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('[send-carer-invitation] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send invitation email"
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
