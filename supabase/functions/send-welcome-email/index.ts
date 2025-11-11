import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  first_name: string;
  last_name: string;
  temporary_password: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, first_name, last_name, temporary_password, role }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email);

    const loginUrl = Deno.env.get("SITE_URL") || "https://med-infinite.care";

    const emailContent = `
      <h2>Welcome to Med-Infinite, ${first_name}!</h2>
      <p>Your ${role} account has been successfully created. You can now access the Med-Infinite Care Management System.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #333;">Your Login Credentials</h3>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; font-size: 14px;">${temporary_password}</code></p>
        <p style="margin: 10px 0; color: #666; font-size: 14px;"><em>Please change your password after your first login for security purposes.</em></p>
      </div>

      <div style="margin: 30px 0;">
        <a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
          Login to Med-Infinite
        </a>
      </div>

      <h3>Getting Started</h3>
      <ul style="line-height: 1.8;">
        <li>Access your dashboard to view key metrics</li>
        <li>Manage bookings, clients, and carers</li>
        <li>Generate reports and track performance</li>
        <li>Configure system settings and permissions</li>
      </ul>

      <p>If you have any questions or need assistance, please don't hesitate to contact your system administrator.</p>
    `;

    const emailHTML = generateMedInfiniteEmailHTML({
      title: `Welcome to Med-Infinite, ${first_name}!`,
      previewText: 'Your admin account has been created - Login credentials inside',
      content: emailContent,
      footerText: 'This is an automated message. Please do not reply to this email.'
    });

    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <noreply@med-infinite.care>",
      to: [email],
      subject: `Welcome to Med-Infinite - Your ${role} Account`,
      html: emailHTML,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Welcome email sent successfully",
        email_id: emailResponse.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send welcome email",
        details: error
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
