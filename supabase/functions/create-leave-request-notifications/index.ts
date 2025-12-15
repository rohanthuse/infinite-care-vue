import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LeaveNotificationRequest {
  leave_request_id: string;
  action: 'submitted' | 'approved' | 'rejected';
  staff_id: string;
  branch_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reviewer_id?: string;
  review_notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: LeaveNotificationRequest = await req.json();
    console.log("[leave-notifications] Processing:", payload);

    const { 
      leave_request_id, 
      action, 
      staff_id, 
      branch_id, 
      leave_type, 
      start_date, 
      end_date,
      reviewer_id,
      review_notes 
    } = payload;

    // Get staff details
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('first_name, last_name, auth_user_id')
      .eq('id', staff_id)
      .single();

    if (staffError) {
      console.error("[leave-notifications] Error fetching staff:", staffError);
      throw staffError;
    }

    const staffName = `${staffData.first_name} ${staffData.last_name}`;
    const dateRange = `${start_date} to ${end_date}`;
    const leaveTypeFormatted = leave_type.charAt(0).toUpperCase() + leave_type.slice(1);

    const notifications: any[] = [];

    if (action === 'submitted') {
      // Notify branch admins about new leave request
      const { data: adminBranches, error: adminError } = await supabase
        .from('admin_branches')
        .select('admin_id')
        .eq('branch_id', branch_id);

      if (adminError) {
        console.error("[leave-notifications] Error fetching admins:", adminError);
      } else if (adminBranches && adminBranches.length > 0) {
        for (const admin of adminBranches) {
          notifications.push({
            user_id: admin.admin_id,
            type: 'leave_request',
            title: 'New Leave Request',
            message: `${staffName} has submitted a ${leaveTypeFormatted} leave request for ${dateRange}`,
            related_entity_type: 'leave_request',
            related_entity_id: leave_request_id,
            priority: 'medium',
            category: 'leave'
          });
        }
        console.log(`[leave-notifications] Created ${notifications.length} admin notifications`);
      }
    } else if (action === 'approved' || action === 'rejected') {
      // Notify staff member about approval/rejection
      if (staffData.auth_user_id) {
        const statusText = action === 'approved' ? 'approved' : 'rejected';
        const title = action === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected';
        
        notifications.push({
          user_id: staffData.auth_user_id,
          type: 'leave_request',
          title: title,
          message: `Your ${leaveTypeFormatted} leave request for ${dateRange} has been ${statusText}${review_notes ? `. Notes: ${review_notes}` : ''}`,
          related_entity_type: 'leave_request',
          related_entity_id: leave_request_id,
          priority: action === 'approved' ? 'low' : 'medium',
          category: 'leave'
        });
        console.log(`[leave-notifications] Created staff notification for ${action}`);
      } else {
        console.log("[leave-notifications] Staff has no auth_user_id, skipping notification");
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (insertError) {
        console.error("[leave-notifications] Error inserting notifications:", insertError);
        throw insertError;
      }
      console.log(`[leave-notifications] Successfully created ${notifications.length} notifications`);
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated: notifications.length }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[leave-notifications] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
