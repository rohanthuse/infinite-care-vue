/**
 * Centralized meeting notification utilities
 * Creates consistent notifications for all meeting actions
 */

import { supabase } from "@/integrations/supabase/client";
import { getStaffAuthUserId, getClientAuthUserId, getBranchAdminUserIds } from "./bookingNotifications";

interface MeetingNotificationData {
  meetingId: string;
  branchId: string;
  organizationId?: string;
  clientId?: string | null;
  staffId?: string | null;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  location: string;
  createdByName?: string;
}

/**
 * Create a meeting notification for a specific user
 */
export async function createMeetingNotification(params: {
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
        type: 'meeting',
        category: 'info',
        priority: params.priority || 'medium',
        title: params.title,
        message: params.message,
        data: params.data,
      });

    if (error) {
      console.error('[meetingNotifications] Error creating notification:', error);
    }
  } catch (err) {
    console.error('[meetingNotifications] Exception creating notification:', err);
  }
}

/**
 * Extract staff ID from notes field (format: "Staff ID: uuid")
 */
function extractStaffIdFromNotes(notes?: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Staff ID: ([a-f0-9-]+)/i);
  return match ? match[1] : null;
}

/**
 * Extract Super Admin IDs from notes field (format: "Super Admin IDs: uuid1,uuid2")
 */
function extractSuperAdminIdsFromNotes(notes?: string | null): string[] {
  if (!notes) return [];
  const match = notes.match(/Super Admin IDs: ([a-f0-9,-]+)/i);
  return match ? match[1].split(',').filter(id => id.trim()) : [];
}

/**
 * Extract Branch Admin IDs from notes field (format: "Branch Admin IDs: uuid1,uuid2")
 */
function extractBranchAdminIdsFromNotes(notes?: string | null): string[] {
  if (!notes) return [];
  const match = notes.match(/Branch Admin IDs: ([a-f0-9,-]+)/i);
  return match ? match[1].split(',').filter(id => id.trim()) : [];
}

/**
 * Get organization_id from branch
 */
async function getOrganizationIdFromBranch(branchId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', branchId)
      .single();
    
    if (error || !data?.organization_id) return null;
    return data.organization_id;
  } catch {
    return null;
  }
}

/**
 * Create notifications for meeting creation
 */
export async function notifyMeetingCreated(params: {
  meetingId: string;
  branchId: string;
  clientId?: string | null;
  notes?: string | null;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  location: string;
  providerName: string;
}): Promise<void> {
  const staffId = extractStaffIdFromNotes(params.notes);
  const organizationId = await getOrganizationIdFromBranch(params.branchId);

  const baseData = {
    meeting_id: params.meetingId,
    client_id: params.clientId,
    staff_id: staffId,
    meeting_title: params.meetingTitle,
    meeting_date: params.meetingDate,
    meeting_time: params.meetingTime,
    location: params.location,
    notification_type: 'meeting_created',
  };

  const formattedDate = new Date(`${params.meetingDate}T${params.meetingTime}`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Notify assigned staff/carer
  if (staffId) {
    const staffAuthId = await getStaffAuthUserId(staffId);
    if (staffAuthId) {
      await createMeetingNotification({
        userId: staffAuthId,
        branchId: params.branchId,
        organizationId: organizationId || undefined,
        title: '📅 New Meeting Scheduled',
        message: `${params.meetingTitle} on ${formattedDate} at ${params.meetingTime}. Created by ${params.providerName}`,
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify client if assigned
  if (params.clientId) {
    const clientAuthId = await getClientAuthUserId(params.clientId);
    if (clientAuthId) {
      await createMeetingNotification({
        userId: clientAuthId,
        branchId: params.branchId,
        organizationId: organizationId || undefined,
        title: '📅 New Meeting Scheduled',
        message: `${params.meetingTitle} on ${formattedDate} at ${params.meetingTime}`,
        priority: 'medium',
        data: baseData,
      });
    }
  }

  // Notify selected super admins
  const superAdminIds = extractSuperAdminIdsFromNotes(params.notes);
  for (const adminId of superAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: params.branchId,
      organizationId: organizationId || undefined,
      title: '📅 New Meeting Scheduled',
      message: `${params.meetingTitle} on ${formattedDate} at ${params.meetingTime}. Created by ${params.providerName}`,
      priority: 'medium',
      data: baseData,
    });
  }

  // Notify selected branch admins
  const branchAdminIds = extractBranchAdminIdsFromNotes(params.notes);
  for (const adminId of branchAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: params.branchId,
      organizationId: organizationId || undefined,
      title: '📅 New Meeting Scheduled',
      message: `${params.meetingTitle} on ${formattedDate} at ${params.meetingTime}. Created by ${params.providerName}`,
      priority: 'medium',
      data: baseData,
    });
  }

  console.log('[meetingNotifications] Meeting creation notifications sent for:', params.meetingId);
}

/**
 * Create notifications for meeting update
 */
export async function notifyMeetingUpdated(params: {
  meetingId: string;
  branchId: string;
  clientId?: string | null;
  notes?: string | null;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  location: string;
}): Promise<void> {
  const staffId = extractStaffIdFromNotes(params.notes);
  const organizationId = await getOrganizationIdFromBranch(params.branchId);

  const baseData = {
    meeting_id: params.meetingId,
    client_id: params.clientId,
    staff_id: staffId,
    meeting_title: params.meetingTitle,
    meeting_date: params.meetingDate,
    meeting_time: params.meetingTime,
    location: params.location,
    notification_type: 'meeting_updated',
  };

  const formattedDate = new Date(`${params.meetingDate}T${params.meetingTime}`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Notify assigned staff/carer
  if (staffId) {
    const staffAuthId = await getStaffAuthUserId(staffId);
    if (staffAuthId) {
      await createMeetingNotification({
        userId: staffAuthId,
        branchId: params.branchId,
        organizationId: organizationId || undefined,
        title: '🔄 Meeting Updated',
        message: `${params.meetingTitle} has been updated. Now on ${formattedDate} at ${params.meetingTime}`,
        priority: 'medium',
        data: baseData,
      });
    }
  }

  // Notify client if assigned
  if (params.clientId) {
    const clientAuthId = await getClientAuthUserId(params.clientId);
    if (clientAuthId) {
      await createMeetingNotification({
        userId: clientAuthId,
        branchId: params.branchId,
        organizationId: organizationId || undefined,
        title: '🔄 Meeting Updated',
        message: `${params.meetingTitle} has been updated. Now on ${formattedDate} at ${params.meetingTime}`,
        priority: 'medium',
        data: baseData,
      });
    }
  }

  // Notify selected super admins
  const superAdminIds = extractSuperAdminIdsFromNotes(params.notes);
  for (const adminId of superAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: params.branchId,
      organizationId: organizationId || undefined,
      title: '🔄 Meeting Updated',
      message: `${params.meetingTitle} has been updated. Now on ${formattedDate} at ${params.meetingTime}`,
      priority: 'medium',
      data: baseData,
    });
  }

  // Notify selected branch admins
  const branchAdminIds = extractBranchAdminIdsFromNotes(params.notes);
  for (const adminId of branchAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: params.branchId,
      organizationId: organizationId || undefined,
      title: '🔄 Meeting Updated',
      message: `${params.meetingTitle} has been updated. Now on ${formattedDate} at ${params.meetingTime}`,
      priority: 'medium',
      data: baseData,
    });
  }

  console.log('[meetingNotifications] Meeting update notifications sent for:', params.meetingId);
}

/**
 * Create notifications for meeting cancellation/deletion
 */
export async function notifyMeetingCancelled(meeting: {
  id: string;
  branch_id: string;
  client_id?: string | null;
  notes?: string | null;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
}): Promise<void> {
  const staffId = extractStaffIdFromNotes(meeting.notes);
  const organizationId = await getOrganizationIdFromBranch(meeting.branch_id);

  const baseData = {
    meeting_id: meeting.id,
    client_id: meeting.client_id,
    staff_id: staffId,
    meeting_title: meeting.appointment_type,
    notification_type: 'meeting_cancelled',
  };

  const formattedDate = new Date(`${meeting.appointment_date}T${meeting.appointment_time}`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  // Notify assigned staff/carer
  if (staffId) {
    const staffAuthId = await getStaffAuthUserId(staffId);
    if (staffAuthId) {
      await createMeetingNotification({
        userId: staffAuthId,
        branchId: meeting.branch_id,
        organizationId: organizationId || undefined,
        title: '❌ Meeting Cancelled',
        message: `${meeting.appointment_type} scheduled for ${formattedDate} has been cancelled`,
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify client if assigned
  if (meeting.client_id) {
    const clientAuthId = await getClientAuthUserId(meeting.client_id);
    if (clientAuthId) {
      await createMeetingNotification({
        userId: clientAuthId,
        branchId: meeting.branch_id,
        organizationId: organizationId || undefined,
        title: '❌ Meeting Cancelled',
        message: `${meeting.appointment_type} scheduled for ${formattedDate} has been cancelled`,
        priority: 'high',
        data: baseData,
      });
    }
  }

  // Notify selected super admins
  const superAdminIds = extractSuperAdminIdsFromNotes(meeting.notes);
  for (const adminId of superAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: meeting.branch_id,
      organizationId: organizationId || undefined,
      title: '❌ Meeting Cancelled',
      message: `${meeting.appointment_type} scheduled for ${formattedDate} has been cancelled`,
      priority: 'high',
      data: baseData,
    });
  }

  // Notify selected branch admins
  const branchAdminIds = extractBranchAdminIdsFromNotes(meeting.notes);
  for (const adminId of branchAdminIds) {
    await createMeetingNotification({
      userId: adminId,
      branchId: meeting.branch_id,
      organizationId: organizationId || undefined,
      title: '❌ Meeting Cancelled',
      message: `${meeting.appointment_type} scheduled for ${formattedDate} has been cancelled`,
      priority: 'high',
      data: baseData,
    });
  }

  console.log('[meetingNotifications] Meeting cancellation notifications sent for:', meeting.id);
}
