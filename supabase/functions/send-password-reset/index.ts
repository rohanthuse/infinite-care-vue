import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
  redirectTo?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify required environment variables
    if (!Deno.env.get("RESEND_API_KEY")) {
      console.error('[send-password-reset] RESEND_API_KEY not configured');
      throw new Error('Email service not configured');
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[send-password-reset] Supabase credentials not configured');
      throw new Error('Authentication service not configured');
    }

    const { email, redirectTo }: PasswordResetRequest = await req.json();
    
    console.log('[send-password-reset] Processing password reset request for:', email);
    console.log('[send-password-reset] Redirect URL:', redirectTo || 'default');
    
    // Create admin client to generate reset token
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[send-password-reset] Attempting to generate reset link...');

    // Generate password reset link with custom redirect
    const defaultRedirectTo = `${Deno.env.get("SITE_URL") || "https://med-infinite.care"}/reset-password`;
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || defaultRedirectTo
      }
    });

    if (error) {
      console.error('[send-password-reset] Error generating reset link:', error);
      throw error;
    }

    const resetLink = data.properties.action_link;
    console.log('[send-password-reset] Reset link generated successfully');

    // Create branded email content
    const emailContent = `
      <div style="padding: 32px 0;">
        <h2 style="color: #1f2937; font-size: 24px; font-weight: bold; margin-bottom: 16px;">
          Password Reset Request
        </h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset your password for your Med-Infinite account. 
          Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" 
             style="display: inline-block; background-color: #2563eb; color: #ffffff !important; 
                    padding: 14px 32px; border-radius: 8px; text-decoration: none; 
                    font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 24px;">
          <strong>This link will expire in 1 hour</strong> for security reasons.
        </p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 16px;">
          If you didn't request a password reset, you can safely ignore this email. 
          Your password will remain unchanged.
        </p>
        <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; line-height: 1.6;">
            <strong>Security Tip:</strong> Never share your password or reset link with anyone. 
            Med-Infinite will never ask for your password via email.
          </p>
        </div>
      </div>
    `;

    const brandedHTML = generateMedInfiniteEmailHTML({
      title: "Reset Your Password",
      previewText: "Reset your Med-Infinite password",
      content: emailContent,
      footerText: "This password reset link will expire in 1 hour."
    });

    console.log('[send-password-reset] Sending email via Resend');

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.care>",
      to: [email],
      subject: "Reset Your Med-Infinite Password",
      html: brandedHTML,
    });

    console.log('[send-password-reset] Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });

  } catch (error: any) {
    console.error('[send-password-reset] Error in send-password-reset function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders }
    });
  }
};

serve(handler);
