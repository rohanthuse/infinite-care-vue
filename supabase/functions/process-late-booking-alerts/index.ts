import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingWithDetails {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  is_late_start: boolean;
  is_missed: boolean;
  late_start_notified_at: string | null;
  missed_notified_at: string | null;
  branch_id: string;
  organization_id: string;
  notes: string | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    address: string;
  } | null;
  staff: {
    id: string;
    first_name: string;
    last_name: string;
    late_arrival_count: number;
    missed_booking_count: number;
    auth_user_id: string | null;
  } | null;
  service: {
    id: string;
    title: string;
  } | null;
}

interface AlertSettings {
  first_alert_delay_minutes: number;
  missed_booking_threshold_minutes: number;
  enable_late_start_alerts: boolean;
  enable_missed_booking_alerts: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[process-late-booking-alerts] Starting...');
    
    const now = new Date();
    // Process bookings from last 7 days to catch any missed during downtime
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const { data: lateBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id, start_time, end_time, status, is_late_start, is_missed,
        late_start_notified_at, missed_notified_at, branch_id, organization_id, notes,
        client:client_id (id, first_name, last_name, address),
        staff:staff_id (id, first_name, last_name, late_arrival_count, missed_booking_count, auth_user_id),
        service:service_id (id, title)
      `)
      .in('status', ['confirmed', 'assigned', 'unassigned'])
      .gte('start_time', sevenDaysAgo.toISOString())
      .lt('start_time', now.toISOString())
      .is('cancelled_at', null)
      .or('cancellation_request_status.is.null,cancellation_request_status.neq.approved')
      .or('reschedule_request_status.is.null,reschedule_request_status.neq.approved')
      .limit(200);

    if (bookingsError) {
      console.error('[process-late-booking-alerts] Error:', bookingsError);
      throw bookingsError;
    }

    if (!lateBookings || lateBookings.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No late bookings', processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[process-late-booking-alerts] Found ${lateBookings.length} bookings to check`);

    // Fetch alert settings
    const { data: alertSettings } = await supabase
      .from('booking_alert_settings')
      .select('*')
      .limit(1)
      .single();

    const settings: AlertSettings = alertSettings || {
      first_alert_delay_minutes: 0,
      missed_booking_threshold_minutes: 3,
      enable_late_start_alerts: true,
      enable_missed_booking_alerts: true,
    };

    // Batch fetch visit records - check for completed visits to avoid re-marking as missed
    const bookingIds = lateBookings.map(b => b.id);
    const { data: visitRecords } = await supabase
      .from('visit_records')
      .select('booking_id, visit_start_time, visit_end_time, status')
      .in('booking_id', bookingIds);

    const visitStartedMap = new Map<string, boolean>();
    const visitCompletedMap = new Map<string, boolean>();
    visitRecords?.forEach(vr => {
      visitStartedMap.set(vr.booking_id, vr.visit_start_time !== null);
      // Mark as completed if status is 'completed' OR has both start and end times
      visitCompletedMap.set(vr.booking_id, vr.status === 'completed' || (vr.visit_start_time !== null && vr.visit_end_time !== null));
    });

    // Batch fetch admins (super admins + branch admins)
    const branchIds = [...new Set(lateBookings.map(b => b.branch_id).filter(Boolean))];
    
    const { data: superAdmins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    const { data: branchAdmins } = await supabase
      .from('admin_branches')
      .select('admin_id, branch_id')
      .in('branch_id', branchIds);

    // Build admin map per branch
    const adminsByBranch = new Map<string, Set<string>>();
    branchIds.forEach(bid => adminsByBranch.set(bid, new Set()));
    superAdmins?.forEach(sa => {
      branchIds.forEach(bid => adminsByBranch.get(bid)?.add(sa.user_id));
    });
    branchAdmins?.forEach(ba => {
      adminsByBranch.get(ba.branch_id)?.add(ba.admin_id);
    });

    let firstAlertsCreated = 0;
    let missedAlertsCreated = 0;
    const lateStartIds: string[] = [];
    const missedUpdates: { id: string; notes: string }[] = [];
    const notifications: any[] = [];

    for (const booking of lateBookings as BookingWithDetails[]) {
      const startTime = new Date(booking.start_time);
      const endTime = new Date(booking.end_time);
      const minutesLate = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      const isPastEndTime = now > endTime;
      const visitWasStarted = visitStartedMap.get(booking.id) || false;

      // Skip if visit was started OR already completed (prevents re-marking completed visits as missed)
      const visitWasCompleted = visitCompletedMap.get(booking.id) || false;
      if (visitWasStarted || visitWasCompleted) continue;

      const clientName = booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Unknown Client';
      const carerName = booking.staff ? `${booking.staff.first_name} ${booking.staff.last_name}` : 'Unassigned';
      const timeSlot = `${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} – ${endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

      // Late start alert
      if (settings.enable_late_start_alerts && minutesLate >= settings.first_alert_delay_minutes && !booking.late_start_notified_at) {
        lateStartIds.push(booking.id);
        
        const admins = adminsByBranch.get(booking.branch_id) || new Set();
        admins.forEach(adminId => {
          notifications.push({
            user_id: adminId,
            branch_id: booking.branch_id,
            title: 'Booking Not Started On Time',
            message: `${carerName} has not started the visit for ${clientName} scheduled at ${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
            type: 'booking_late_start',
            category: 'booking',
            priority: 'high',
            data: JSON.stringify({ booking_id: booking.id, client_name: clientName, carer_name: carerName, minutes_late: minutesLate }),
            read: false,
            created_at: now.toISOString(),
          });
        });
        firstAlertsCreated++;
      }

      // Missed booking alert
      if (settings.enable_missed_booking_alerts && isPastEndTime && !booking.missed_notified_at) {
        missedUpdates.push({
          id: booking.id,
          notes: booking.notes ? `${booking.notes}\n\nAuto – Visit not started` : 'Auto – Visit not started',
        });

        const admins = adminsByBranch.get(booking.branch_id) || new Set();
        admins.forEach(adminId => {
          notifications.push({
            user_id: adminId,
            branch_id: booking.branch_id,
            title: 'Missed Booking Alert',
            message: `Booking ${timeSlot} was auto marked as Missed. Carer: ${carerName}, Client: ${clientName}`,
            type: 'booking_missed',
            category: 'booking',
            priority: 'critical',
            data: JSON.stringify({ booking_id: booking.id, client_name: clientName, carer_name: carerName, scheduled_time: timeSlot }),
            read: false,
            created_at: now.toISOString(),
          });
        });

        if (booking.staff?.auth_user_id) {
          notifications.push({
            user_id: booking.staff.auth_user_id,
            branch_id: booking.branch_id,
            title: 'Booking Marked as Missed',
            message: `Your scheduled visit ${timeSlot} for ${clientName} was marked as Missed.`,
            type: 'booking_missed',
            category: 'booking',
            priority: 'high',
            data: JSON.stringify({ booking_id: booking.id, client_name: clientName }),
            read: false,
            created_at: now.toISOString(),
          });
        }
        missedAlertsCreated++;
      }
    }

    // Batch updates
    if (lateStartIds.length > 0) {
      await supabase.from('bookings').update({
        is_late_start: true,
        late_start_notified_at: now.toISOString(),
      }).in('id', lateStartIds);
    }

    for (const upd of missedUpdates) {
      await supabase.from('bookings').update({
        status: 'missed',
        is_missed: true,
        missed_notified_at: now.toISOString(),
        notes: upd.notes,
      }).eq('id', upd.id);
    }

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    const result = { success: true, processed: lateBookings.length, firstAlertsCreated, missedAlertsCreated };
    console.log('[process-late-booking-alerts] Done:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[process-late-booking-alerts] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
