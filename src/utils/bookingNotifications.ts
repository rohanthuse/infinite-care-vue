/**
 * Centralized booking notification utilities
 * Creates consistent notifications for all booking actions
 */

import { supabase } from "@/integrations/supabase/client";

interface BookingNotificationData {
  bookingId: string;
  branchId: string;
  organizationId?: string;
  clientId?: string;
  staffId?: string;
  clientName?: string;
  carerName?: string;
  serviceName?: string;
  startTime?: string;
  notificationType: string;
}

/**
 * Get admin user IDs for a branch (from profiles with admin role linked to branch)
 */
export async function getBranchAdminUserIds(branchId: string): Promise<string[]> {
  try {
    // Get admin profiles linked to this branch via admin_branches
    const { data: adminBranches, error } = await supabase
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', branchId);

    if (error) {
      console.error('[bookingNotifications] Error fetching branch admins:', error);
      return [];
    }

    return (adminBranches || []).map(ab => ab.admin_id);
  } catch (err) {
    console.error('[bookingNotifications] Exception fetching branch admins:', err);
    return [];
  }
}

/**
 * Get staff auth_user_id from staff id
 */
export async function getStaffAuthUserId(staffId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('auth_user_id')
      .eq('id', staffId)
      .single();

    if (error || !data?.auth_user_id) {
      return null;
    }
    return data.auth_user_id;
  } catch {
    return null;
  }
}

/**
 * Get client auth_user_id from client id
 */
export async function getClientAuthUserId(clientId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('auth_user_id')
      .eq('id', clientId)
      .single();

    if (error || !data?.auth_user_id) {
      return null;
    }
    return data.auth_user_id;
  } catch {
    return null;
  }
}

/**
 * Create a booking notification for a specific user
 */
export async function createBookingNotification(params: {
  userId: string;
  branchId: string;
  organizationId?: string;
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
  data: Record<string, any>;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        branch_id: params.branchId,
        organization_id: params.organizationId || null,
        type: 'booking',
        category: 'info',
        priority: params.priority || 'medium',
        title: params.title,
        message: params.message,
        data: params.data,
      });

    if (error) {
      console.error('[bookingNotifications] Error creating notification:', error);
    }
  } catch (err) {
    console.error('[bookingNotifications] Exception creating notification:', err);
  }
}

/**
 * Create notifications for booking creation
 */
export async function notifyBookingCreated(booking: BookingNotificationData): Promise<void> {
  const baseData = {
    booking_id: booking.bookingId,
    client_id: booking.clientId,
    staff_id: booking.staffId,
    notification_type: 'booking_created',
  };

  // Notify assigned carer
  if (booking.staffId) {
    const carerAuthId = await getStaffAuthUserId(booking.staffId);
    if (carerAuthId) {
      await createBookingNotification({
        userId: carerAuthId,
        branchId: booking.branchId,
        organizationId: booking.organizationId,
        title: '📅 New Booking Assigned',
        message: `You have a new booking${booking.clientName ? ` with ${booking.clientName}` : ''}${booking.startTime ? ` on ${new Date(booking.startTime).toLocaleDateString()}` : ''}`,
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify client
  if (booking.clientId) {
    const clientAuthId = await getClientAuthUserId(booking.clientId);
    if (clientAuthId) {
      await createBookingNotification({
        userId: clientAuthId,
        branchId: booking.branchId,
        organizationId: booking.organizationId,
        title: '✅ Booking Confirmed',
        message: `Your booking has been confirmed${booking.startTime ? ` for ${new Date(booking.startTime).toLocaleDateString()}` : ''}`,
        priority: 'medium',
        data: baseData,
      });
    }
  }

  // Notify branch admins
  const adminIds = await getBranchAdminUserIds(booking.branchId);
  for (const adminId of adminIds) {
    await createBookingNotification({
      userId: adminId,
      branchId: booking.branchId,
      organizationId: booking.organizationId,
      title: '📅 New Booking Created',
      message: `Booking created${booking.clientName ? ` for ${booking.clientName}` : ''}${booking.carerName ? ` with ${booking.carerName}` : ''}${booking.startTime ? ` on ${new Date(booking.startTime).toLocaleDateString()}` : ''}`,
      priority: 'low',
      data: { ...baseData, notification_type: 'booking_created_admin' },
    });
  }

  console.log('[bookingNotifications] Booking creation notifications sent');
}

/**
 * Create notifications for booking update
 */
export async function notifyBookingUpdated(params: {
  booking: BookingNotificationData;
  changes: {
    staffChanged?: { oldStaffId?: string; newStaffId?: string };
    timeChanged?: boolean;
    statusChanged?: { oldStatus?: string; newStatus?: string };
  };
}): Promise<void> {
  const { booking, changes } = params;
  const baseData = {
    booking_id: booking.bookingId,
    client_id: booking.clientId,
    staff_id: booking.staffId,
    notification_type: 'booking_updated',
  };

  // If staff changed, notify old and new carer
  if (changes.staffChanged) {
    // Notify old carer (removed from booking)
    if (changes.staffChanged.oldStaffId) {
      const oldCarerAuthId = await getStaffAuthUserId(changes.staffChanged.oldStaffId);
      if (oldCarerAuthId) {
        await createBookingNotification({
          userId: oldCarerAuthId,
          branchId: booking.branchId,
          organizationId: booking.organizationId,
          title: '📤 Booking Reassigned',
          message: `A booking${booking.clientName ? ` with ${booking.clientName}` : ''} has been reassigned to another carer`,
          priority: 'medium',
          data: { ...baseData, notification_type: 'booking_reassigned_from' },
        });
      }
    }

    // Notify new carer (assigned to booking)
    if (changes.staffChanged.newStaffId) {
      const newCarerAuthId = await getStaffAuthUserId(changes.staffChanged.newStaffId);
      if (newCarerAuthId) {
        await createBookingNotification({
          userId: newCarerAuthId,
          branchId: booking.branchId,
          organizationId: booking.organizationId,
          title: '📅 New Booking Assigned',
          message: `You have been assigned a booking${booking.clientName ? ` with ${booking.clientName}` : ''}`,
          priority: 'high',
          data: { ...baseData, notification_type: 'booking_reassigned_to' },
        });
      }
    }
  }

  // If time changed, notify client and carer
  if (changes.timeChanged) {
    if (booking.staffId) {
      const carerAuthId = await getStaffAuthUserId(booking.staffId);
      if (carerAuthId) {
        await createBookingNotification({
          userId: carerAuthId,
          branchId: booking.branchId,
          organizationId: booking.organizationId,
          title: '🕐 Booking Time Changed',
          message: `Booking time has been updated${booking.startTime ? ` to ${new Date(booking.startTime).toLocaleDateString()}` : ''}`,
          priority: 'medium',
          data: { ...baseData, notification_type: 'booking_time_changed' },
        });
      }
    }

    if (booking.clientId) {
      const clientAuthId = await getClientAuthUserId(booking.clientId);
      if (clientAuthId) {
        await createBookingNotification({
          userId: clientAuthId,
          branchId: booking.branchId,
          organizationId: booking.organizationId,
          title: '🕐 Booking Rescheduled',
          message: `Your booking has been rescheduled${booking.startTime ? ` to ${new Date(booking.startTime).toLocaleDateString()}` : ''}`,
          priority: 'medium',
          data: { ...baseData, notification_type: 'booking_time_changed' },
        });
      }
    }
  }

  // If status changed to completed
  if (changes.statusChanged?.newStatus === 'completed') {
    if (booking.clientId) {
      const clientAuthId = await getClientAuthUserId(booking.clientId);
      if (clientAuthId) {
        await createBookingNotification({
          userId: clientAuthId,
          branchId: booking.branchId,
          organizationId: booking.organizationId,
          title: '✅ Booking Completed',
          message: 'Your booking has been marked as completed',
          priority: 'low',
          data: { ...baseData, notification_type: 'booking_completed' },
        });
      }
    }
  }

  console.log('[bookingNotifications] Booking update notifications sent');
}

/**
 * Create notifications for booking cancellation/deletion
 */
export async function notifyBookingCancelled(booking: BookingNotificationData & { cancellationReason?: string }): Promise<void> {
  const baseData = {
    booking_id: booking.bookingId,
    client_id: booking.clientId,
    staff_id: booking.staffId,
    notification_type: 'booking_cancelled',
    notification_methods: ['in_app', 'email'], // Enable email notifications for cancellations
    cancellation_reason: booking.cancellationReason,
  };

  // Notify carer
  if (booking.staffId) {
    const carerAuthId = await getStaffAuthUserId(booking.staffId);
    if (carerAuthId) {
      await createBookingNotification({
        userId: carerAuthId,
        branchId: booking.branchId,
        organizationId: booking.organizationId,
        title: '❌ Booking Cancelled',
        message: `A booking${booking.clientName ? ` with ${booking.clientName}` : ''} has been cancelled`,
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify client
  if (booking.clientId) {
    const clientAuthId = await getClientAuthUserId(booking.clientId);
    if (clientAuthId) {
      await createBookingNotification({
        userId: clientAuthId,
        branchId: booking.branchId,
        organizationId: booking.organizationId,
        title: '❌ Booking Cancelled',
        message: 'Your booking has been cancelled',
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify branch admins
  const adminIds = await getBranchAdminUserIds(booking.branchId);
  for (const adminId of adminIds) {
    await createBookingNotification({
      userId: adminId,
      branchId: booking.branchId,
      organizationId: booking.organizationId,
      title: '❌ Booking Cancelled',
      message: `Booking cancelled${booking.clientName ? ` for ${booking.clientName}` : ''}${booking.carerName ? ` (${booking.carerName})` : ''}${booking.cancellationReason ? `: ${booking.cancellationReason}` : ''}`,
      priority: 'medium',
      data: { ...baseData, notification_type: 'booking_cancelled_admin' },
    });
  }

  console.log('[bookingNotifications] Booking cancellation notifications sent');
}

/**
 * Create notification for admin about booking change requests
 */
export async function notifyAdminsBookingChangeRequest(params: {
  branchId: string;
  organizationId?: string;
  requestType: 'cancellation' | 'reschedule';
  bookingId: string;
  clientId: string;
  requestId: string;
  newDate?: string;
  newTime?: string;
}): Promise<void> {
  const adminIds = await getBranchAdminUserIds(params.branchId);
  
  if (adminIds.length === 0) {
    console.warn('[bookingNotifications] No admins found for branch:', params.branchId);
    return;
  }

  const title = params.requestType === 'cancellation' 
    ? '🔴 New Cancellation Request' 
    : '🟠 New Reschedule Request';
  
  const message = params.requestType === 'cancellation'
    ? 'A client has requested to cancel a booking'
    : `A client has requested to reschedule a booking${params.newDate ? ` to ${params.newDate}` : ''}`;

  const data = {
    booking_id: params.bookingId,
    client_id: params.clientId,
    request_type: params.requestType,
    request_id: params.requestId,
    notification_type: `booking_${params.requestType}_request`,
    ...(params.newDate && { new_date: params.newDate }),
    ...(params.newTime && { new_time: params.newTime }),
  };

  // Create notification for each admin
  for (const adminId of adminIds) {
    await createBookingNotification({
      userId: adminId,
      branchId: params.branchId,
      organizationId: params.organizationId,
      title,
      message,
      priority: 'high',
      data,
    });
  }

  console.log(`[bookingNotifications] Notified ${adminIds.length} admins about ${params.requestType} request`);
}
