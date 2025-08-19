
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

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
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'medinfinite.com') || 'https://medinfinite.com';
    const invitationUrl = `${siteUrl}/carer-invitation?token=${invitation_token}`;

    // Send the invitation email
    const emailResponse = await resend.emails.send({
      from: "CarePortal <onboarding@resend.dev>",
      to: [email],
      subject: `Welcome to CarePortal - Complete Your Carer Account Setup`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to CarePortal</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 16px;">❤️</span>
                </div>
                <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #1f2937;">CarePortal</h1>
              </div>
            </div>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; margin-bottom: 30px;">
              <h2 style="margin: 0 0 20px 0; font-size: 20px; color: #1f2937;">Welcome ${first_name}!</h2>
              
              <p style="margin: 0 0 15px 0; color: #4b5563;">You have been invited to join <strong>${branch_name}</strong> as a carer on CarePortal.</p>
              
              <p style="margin: 0 0 25px 0; color: #4b5563;">To complete your account setup and start your journey with us, please click the button below to create your password and access your carer dashboard.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block; transition: background-color 0.2s;">
                  Accept Invitation & Set Password
                </a>
              </div>
              
              <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #3b82f6; word-break: break-all;">${invitationUrl}</p>
            </div>
            
            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
              <p style="margin: 0; font-size: 14px; color: #c2410c;">
                <strong>Important:</strong> This invitation link will expire in 7 days. Please complete your account setup as soon as possible.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #6b7280;">What's next after you accept:</p>
              <ul style="margin: 0 0 15px 0; padding-left: 20px; font-size: 14px; color: #6b7280;">
                <li>Set up your secure password</li>
                <li>Complete your carer profile</li>
                <li>Access your personalized dashboard</li>
                <li>Start managing your care assignments</li>
              </ul>
              
              <p style="margin: 15px 0 0 0; font-size: 13px; color: #9ca3af;">
                If you didn't expect this invitation or have any questions, please contact your branch administrator or reply to this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                This email was sent by CarePortal on behalf of ${branch_name}
              </p>
            </div>
          </body>
        </html>
      `,
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
