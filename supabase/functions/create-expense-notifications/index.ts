import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExpenseNotificationRequest {
  action: 'submitted' | 'approved' | 'rejected';
  expense_id: string;
  staff_id: string;
  staff_name?: string;
  branch_id: string;
  expense_source: string;
  expense_type: string;
  amount: number;
  client_name?: string;
  booking_id?: string;
  rejection_reason?: string;
}

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'past_booking':
      return 'Past Booking';
    case 'general_claim':
      return 'Expense Claim';
    case 'travel_mileage':
      return 'Travel & Mileage';
    case 'extra_time':
      return 'Extra Time';
    default:
      return source || 'Unknown';
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ExpenseNotificationRequest = await req.json();
    console.log('[create-expense-notifications] Received request:', body);

    const {
      action,
      expense_id,
      staff_id,
      staff_name,
      branch_id,
      expense_source,
      expense_type,
      amount,
      client_name,
      booking_id,
      rejection_reason
    } = body;

    const sourceLabel = getSourceLabel(expense_source);
    const formattedAmount = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);

    const notifications: {
      user_id: string;
      title: string;
      message: string;
      type: string;
      data: Record<string, unknown>;
    }[] = [];

    if (action === 'submitted') {
      // Notify admins when a carer submits an expense
      console.log('[create-expense-notifications] Action: submitted - notifying admins');

      // Get branch admins
      const { data: branchAdmins, error: branchAdminError } = await supabase
        .from('admin_branches')
        .select('admin_id')
        .eq('branch_id', branch_id);

      if (branchAdminError) {
        console.error('[create-expense-notifications] Error fetching branch admins:', branchAdminError);
      }

      // Get profiles for admin auth_user_ids
      const adminIds = branchAdmins?.map(a => a.admin_id) || [];
      
      if (adminIds.length > 0) {
        const { data: adminProfiles, error: profileError } = await supabase
          .from('profiles')
          .select('auth_user_id')
          .in('id', adminIds);

        if (profileError) {
          console.error('[create-expense-notifications] Error fetching admin profiles:', profileError);
        }

        const adminUserIds = adminProfiles?.map(p => p.auth_user_id).filter(Boolean) || [];

        let message = `${staff_name || 'A carer'} submitted a ${expense_type} expense of ${formattedAmount}`;
        if (expense_source === 'past_booking' && client_name) {
          message += ` (${sourceLabel} - ${client_name})`;
        } else {
          message += ` (${sourceLabel})`;
        }

        for (const userId of adminUserIds) {
          if (userId) {
            notifications.push({
              user_id: userId,
              title: 'New Expense Submitted',
              message,
              type: 'expense_submitted',
              data: {
                expense_id,
                staff_id,
                expense_source,
                booking_id,
                redirect_url: '/finance?tab=expenses'
              }
            });
          }
        }
      }

      // Also get super admins
      const { data: superAdmins, error: superAdminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');

      if (superAdminError) {
        console.error('[create-expense-notifications] Error fetching super admins:', superAdminError);
      }

      if (superAdmins && superAdmins.length > 0) {
        let message = `${staff_name || 'A carer'} submitted a ${expense_type} expense of ${formattedAmount}`;
        if (expense_source === 'past_booking' && client_name) {
          message += ` (${sourceLabel} - ${client_name})`;
        } else {
          message += ` (${sourceLabel})`;
        }

        for (const admin of superAdmins) {
          // Avoid duplicates if admin is already in branch admins
          const alreadyNotified = notifications.some(n => n.user_id === admin.user_id);
          if (!alreadyNotified && admin.user_id) {
            notifications.push({
              user_id: admin.user_id,
              title: 'New Expense Submitted',
              message,
              type: 'expense_submitted',
              data: {
                expense_id,
                staff_id,
                expense_source,
                booking_id,
                redirect_url: '/finance?tab=expenses'
              }
            });
          }
        }
      }

    } else if (action === 'approved' || action === 'rejected') {
      // Notify carer when admin approves/rejects their expense
      console.log(`[create-expense-notifications] Action: ${action} - notifying carer`);

      // Get the carer's auth_user_id from staff table
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('auth_user_id')
        .eq('id', staff_id)
        .single();

      if (staffError) {
        console.error('[create-expense-notifications] Error fetching staff data:', staffError);
      }

      if (staffData?.auth_user_id) {
        const statusText = action === 'approved' ? 'approved' : 'rejected';
        let message = `Your ${expense_type} expense of ${formattedAmount} has been ${statusText}.`;
        
        if (action === 'rejected' && rejection_reason) {
          message += ` Reason: ${rejection_reason}`;
        }

        notifications.push({
          user_id: staffData.auth_user_id,
          title: action === 'approved' ? 'Expense Approved' : 'Expense Rejected',
          message,
          type: `expense_${action}`,
          data: {
            expense_id,
            expense_source,
            status: action,
            rejection_reason,
            redirect_url: '/carer/payments?tab=expenses'
          }
        });
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      console.log(`[create-expense-notifications] Inserting ${notifications.length} notifications`);
      
      const notificationRecords = notifications.map(n => ({
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        data: n.data,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationRecords);

      if (insertError) {
        console.error('[create-expense-notifications] Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log('[create-expense-notifications] Notifications created successfully');
    } else {
      console.log('[create-expense-notifications] No notifications to create');
    }

    return new Response(
      JSON.stringify({ success: true, notificationsCreated: notifications.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[create-expense-notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
