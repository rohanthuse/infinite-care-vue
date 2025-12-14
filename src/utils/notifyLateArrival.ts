import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface NotifyLateArrivalParams {
  bookingId: string;
  branchId: string;
  organizationId?: string;
  carerName: string;
  clientName: string;
  minutesLate: number;
  reason: string;
  startTime: Date;
  endTime: Date;
}

/**
 * Sends notifications to branch admins when a carer confirms late arrival
 */
export async function notifyAdminOfLateArrival(params: NotifyLateArrivalParams): Promise<void> {
  const { 
    bookingId, 
    branchId, 
    organizationId, 
    carerName, 
    clientName, 
    minutesLate, 
    reason, 
    startTime, 
    endTime 
  } = params;

  try {
    // Get branch admins
    const { data: branchAdmins, error: adminError } = await supabase
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', branchId);

    if (adminError) {
      console.error('[notifyLateArrival] Error fetching branch admins:', adminError);
      return;
    }

    if (!branchAdmins || branchAdmins.length === 0) {
      console.log('[notifyLateArrival] No branch admins found for branch:', branchId);
      return;
    }

    const timeSlot = `${format(startTime, 'HH:mm')}–${format(endTime, 'HH:mm')}`;

    // Create notification for each admin
    const notifications = branchAdmins.map(admin => ({
      user_id: admin.admin_id,
      branch_id: branchId,
      organization_id: organizationId || null,
      type: 'late_arrival_confirmed',
      category: 'booking',
      priority: 'medium',
      title: 'Late Arrival Reported',
      message: `${carerName} arrived ${minutesLate} minutes late for visit with ${clientName} (${timeSlot}). Reason: ${reason}`,
      data: {
        booking_id: bookingId,
        carer_name: carerName,
        client_name: clientName,
        minutes_late: minutesLate,
        reason: reason,
        time_slot: timeSlot
      }
    }));

    const { error: notifyError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifyError) {
      console.error('[notifyLateArrival] Error creating notifications:', notifyError);
    } else {
      console.log('[notifyLateArrival] Created', notifications.length, 'admin notifications');
    }
  } catch (error) {
    console.error('[notifyLateArrival] Unexpected error:', error);
  }
}
