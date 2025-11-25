import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { corsHeaders } from "../_shared/cors.ts";
import { generateMedInfiniteEmailHTML } from "../_shared/email-template.ts";
import { generateNotificationEmailContent } from "./email-content.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

interface NotificationEmailRequest {
  notification_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { notification_id }: NotificationEmailRequest = await req.json();

    if (!notification_id) {
      throw new Error("notification_id is required");
    }

    console.log("Processing email for notification:", notification_id);

    // Fetch notification details
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('id', notification_id)
      .single();

    if (notificationError || !notification) {
      throw new Error(`Failed to fetch notification: ${notificationError?.message}`);
    }

    // Only send emails for high and urgent priority notifications
    if (notification.priority !== 'high' && notification.priority !== 'urgent') {
      console.log(`Skipping email for ${notification.priority} priority notification`);
      return new Response(
        JSON.stringify({ message: "Email not sent for low/medium priority" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email notification was requested
    const notificationMethods = notification.data?.notification_methods || [];
    if (!Array.isArray(notificationMethods) || !notificationMethods.includes('email')) {
      console.log('Email notification not requested for this notification');
      return new Response(
        JSON.stringify({ message: "Email notification not requested" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email was already sent
    if (notification.email_sent) {
      console.log("Email already sent for this notification");
      return new Response(
        JSON.stringify({ message: "Email already sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if alternative email should be used
    const otherEmailAddress = notification.data?.other_email_address;
    let recipientEmail: string;
    let recipientName: string;

    if (otherEmailAddress) {
      // Validate the alternative email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(otherEmailAddress)) {
        console.error('Invalid alternative email format:', otherEmailAddress);
        throw new Error('Invalid alternative email address format');
      }
      
      recipientEmail = otherEmailAddress;
      recipientName = 'Recipient';
      console.log('Using alternative email address:', recipientEmail);
    } else {
      // Fetch user details to get email
      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(
        notification.user_id
      );

      if (userError || !userData?.user?.email) {
        throw new Error(`Failed to fetch user email: ${userError?.message}`);
      }

      recipientEmail = userData.user.email;

      // Fetch user profile to get name
      const { data: profiles } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', notification.user_id)
        .single();

      recipientName = profiles?.full_name || recipientEmail.split('@')[0];
      console.log('Using user account email:', recipientEmail);
    }

    // Generate email content based on notification type
    const emailContent = generateNotificationEmailContent(notification, recipientName);

    // Generate branded email HTML
    const emailHTML = generateMedInfiniteEmailHTML({
      title: emailContent.subject,
      previewText: notification.title,
      content: emailContent.htmlContent,
      footerText: otherEmailAddress 
        ? "You are receiving this email because you were specified as an alternative contact for high-priority notifications."
        : "You are receiving this email because you have high-priority notifications enabled. You can manage your notification preferences in your account settings.",
    });

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Med-Infinite <notifications@med-infinite.care>",
      to: [recipientEmail],
      subject: emailContent.subject,
      html: emailHTML,
    });

    console.log(`Email sent successfully to ${recipientEmail}:`, emailResponse);

    // Mark notification as email sent
    const { error: updateError } = await supabaseClient
      .from('notifications')
      .update({ email_sent: true })
      .eq('id', notification_id);

    if (updateError) {
      console.error("Failed to update notification email_sent flag:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        email_id: emailResponse.id,
        message: "Email sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
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
