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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[process-late-booking-alerts] Starting late booking check...');
    
    const now = new Date();
    
    // Fetch bookings that are past their start time but not yet started
    // Status should be 'confirmed' or 'assigned' (not started)
    const { data: lateBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_time,
        end_time,
        status,
        is_late_start,
        is_missed,
        late_start_notified_at,
        missed_notified_at,
        branch_id,
        organization_id,
        client:client_id (
          id,
          first_name,
          last_name,
          address
        ),
        staff:staff_id (
          id,
          first_name,
          last_name,
          late_arrival_count,
          missed_booking_count
        ),
        service:service_id (
          id,
          name
        )
      `)
      .in('status', ['confirmed', 'assigned'])
      .lt('start_time', now.toISOString())
      .is('cancelled_at', null);

    if (bookingsError) {
      console.error('[process-late-booking-alerts] Error fetching bookings:', bookingsError);
      throw bookingsError;
    }

    console.log(`[process-late-booking-alerts] Found ${lateBookings?.length || 0} potentially late bookings`);

    if (!lateBookings || lateBookings.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No late bookings found',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch alert settings (use defaults if not configured)
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

    console.log('[process-late-booking-alerts] Using settings:', settings);

    let firstAlertsCreated = 0;
    let missedAlertsCreated = 0;
    let staffUpdated = 0;

    for (const booking of lateBookings as BookingWithDetails[]) {
      const startTime = new Date(booking.start_time);
      const minutesLate = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
      
      console.log(`[process-late-booking-alerts] Booking ${booking.id}: ${minutesLate} minutes late`);

      // First Alert: Send immediately when booking is late (after first_alert_delay_minutes)
      if (
        settings.enable_late_start_alerts &&
        minutesLate >= settings.first_alert_delay_minutes &&
        !booking.late_start_notified_at
      ) {
        console.log(`[process-late-booking-alerts] Creating first alert for booking ${booking.id}`);
        
        // Create notification for Super Admins
        await createNotification(supabase, {
          booking,
          type: 'late_start',
          minutesLate,
          settings,
        });

        // Update booking to mark as late start notified
        await supabase
          .from('bookings')
          .update({
            is_late_start: true,
            late_start_notified_at: now.toISOString(),
            late_start_minutes: minutesLate,
          })
          .eq('id', booking.id);

        firstAlertsCreated++;
      }

      // Second Alert (Missed Booking): After grace period
      if (
        settings.enable_missed_booking_alerts &&
        minutesLate >= settings.missed_booking_threshold_minutes &&
        !booking.missed_notified_at
      ) {
        console.log(`[process-late-booking-alerts] Creating missed booking alert for booking ${booking.id}`);
        
        // Create missed booking notification
        await createNotification(supabase, {
          booking,
          type: 'missed_booking',
          minutesLate,
          settings,
        });

        // Update booking to mark as missed
        await supabase
          .from('bookings')
          .update({
            is_missed: true,
            missed_notified_at: now.toISOString(),
          })
          .eq('id', booking.id);

        // Update staff performance metrics
        if (booking.staff) {
          const newLateCount = (booking.staff.late_arrival_count || 0) + 1;
          const newMissedCount = (booking.staff.missed_booking_count || 0) + 1;
          
          // Calculate new punctuality score (simple formula)
          // Get total bookings for this staff
          const { count: totalBookings } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', booking.staff.id)
            .in('status', ['completed', 'in_progress', 'confirmed', 'assigned']);

          const total = totalBookings || 1;
          const punctualityScore = Math.max(0, Math.round(((total - newLateCount) / total) * 100));

          await supabase
            .from('staff')
            .update({
              late_arrival_count: newLateCount,
              missed_booking_count: newMissedCount,
              punctuality_score: punctualityScore,
            })
            .eq('id', booking.staff.id);

          staffUpdated++;
          console.log(`[process-late-booking-alerts] Updated staff ${booking.staff.id} performance metrics`);
        }

        missedAlertsCreated++;
      }
    }

    const result = {
      success: true,
      processed: lateBookings.length,
      firstAlertsCreated,
      missedAlertsCreated,
      staffUpdated,
      timestamp: now.toISOString(),
    };

    console.log('[process-late-booking-alerts] Processing complete:', result);

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

async function createNotification(
  supabase: any,
  params: {
    booking: BookingWithDetails;
    type: 'late_start' | 'missed_booking';
    minutesLate: number;
    settings: AlertSettings;
  }
) {
  const { booking, type, minutesLate } = params;
  
  const clientName = booking.client 
    ? `${booking.client.first_name} ${booking.client.last_name}` 
    : 'Unknown Client';
  
  const carerName = booking.staff 
    ? `${booking.staff.first_name} ${booking.staff.last_name}` 
    : 'Unassigned';
  
  const serviceName = booking.service?.title || 'Care Service';
  const location = booking.client?.address || 'Address not provided';
  
  const startTime = new Date(booking.start_time);
  const endTime = new Date(booking.end_time);
  const timeSlot = `${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  
  let title: string;
  let message: string;
  let priority: string;

  if (type === 'late_start') {
    title = 'Booking Not Started On Time';
    message = `${carerName} has not started the visit for ${clientName} scheduled at ${startTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    priority = 'high';
  } else {
    title = 'Missed Booking Alert';
    message = `${carerName} missed the booking for ${clientName} - Grace period exceeded (${minutesLate} minutes late)`;
    priority = 'critical';
  }

  // Build notification details
  const details = JSON.stringify({
    booking_id: booking.id,
    client_name: clientName,
    carer_name: carerName,
    service: serviceName,
    location: location,
    scheduled_time: timeSlot,
    minutes_late: minutesLate,
    status: type === 'late_start' ? 'Booking not started on time' : 'Missed Booking / Late Arrival by Carer',
  });

  // Get Super Admins to notify
  const { data: superAdmins } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', 'super_admin');

  // Get Branch Admins for this branch
  const { data: branchAdmins } = await supabase
    .from('admin_branches')
    .select('admin_id')
    .eq('branch_id', booking.branch_id);

  const recipientIds = new Set<string>();
  
  superAdmins?.forEach((sa: { user_id: string }) => recipientIds.add(sa.user_id));
  branchAdmins?.forEach((ba: { admin_id: string }) => recipientIds.add(ba.admin_id));

  // Create notifications for each admin
  const notifications = Array.from(recipientIds).map(userId => ({
    user_id: userId,
    title,
    message,
    type: type === 'late_start' ? 'booking_late_start' : 'booking_missed',
    priority,
    data: details,
    read: false,
    created_at: new Date().toISOString(),
  }));

  if (notifications.length > 0) {
    const { error } = await supabase.from('notifications').insert(notifications);
    
    if (error) {
      console.error('[process-late-booking-alerts] Error creating notifications:', error);
    } else {
      console.log(`[process-late-booking-alerts] Created ${notifications.length} notifications for ${type}`);
    }
  }
}
