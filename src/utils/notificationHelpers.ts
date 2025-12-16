/**
 * Centralized notification creation helpers
 * Provides type-safe, consistent notification creation for all modules
 */

import { supabase } from "@/integrations/supabase/client";

export type NotificationType = 
  | 'booking' | 'task' | 'appointment' | 'document' | 'system' 
  | 'staff' | 'client' | 'medication' | 'rota' | 'message' 
  | 'payroll' | 'invoice' | 'care_plan' | 'leave';

export type NotificationCategory = 'info' | 'warning' | 'error' | 'success';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateNotificationParams {
  userId: string;
  branchId?: string;
  organizationId?: string;
  type: NotificationType;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Create a notification for a specific user
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        branch_id: params.branchId || null,
        organization_id: params.organizationId || null,
        type: params.type,
        category: params.category || 'info',
        priority: params.priority || 'medium',
        title: params.title,
        message: params.message,
        data: params.data || null,
      });

    if (error) {
      console.error('[notificationHelpers] Error creating notification:', error);
      return false;
    }

    console.log('[notificationHelpers] Notification created:', params.title);
    return true;
  } catch (err) {
    console.error('[notificationHelpers] Exception creating notification:', err);
    return false;
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<number> {
  let successCount = 0;
  
  for (const userId of userIds) {
    const success = await createNotification({ ...params, userId });
    if (success) successCount++;
  }
  
  console.log(`[notificationHelpers] Created ${successCount}/${userIds.length} bulk notifications`);
  return successCount;
}

/**
 * Get branch admin user IDs
 */
export async function getBranchAdminUserIds(branchId: string): Promise<string[]> {
  try {
    const { data: adminBranches, error } = await supabase
      .from('admin_branches')
      .select('admin_id')
      .eq('branch_id', branchId);

    if (error) {
      console.error('[notificationHelpers] Error fetching branch admins:', error);
      return [];
    }

    return (adminBranches || []).map(ab => ab.admin_id);
  } catch (err) {
    console.error('[notificationHelpers] Exception fetching branch admins:', err);
    return [];
  }
}

/**
 * Get staff auth_user_id from staff table id
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
 * Get client auth_user_id from client table id
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
 * Get staff info by ID
 */
export async function getStaffInfo(staffId: string): Promise<{ firstName: string; lastName: string; authUserId: string | null } | null> {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('first_name, last_name, auth_user_id')
      .eq('id', staffId)
      .single();

    if (error || !data) return null;
    
    return {
      firstName: data.first_name,
      lastName: data.last_name,
      authUserId: data.auth_user_id
    };
  } catch {
    return null;
  }
}

/**
 * Notify staff about payroll - called when payroll is created or status changes
 */
export async function notifyStaffPayrollCreated(params: {
  staffId: string;
  branchId: string;
  payrollId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  netPay: number;
  paymentStatus: string;
}): Promise<void> {
  const staffInfo = await getStaffInfo(params.staffId);
  if (!staffInfo?.authUserId) {
    console.warn('[notificationHelpers] Staff has no auth_user_id, cannot send notification');
    return;
  }

  const periodStart = new Date(params.payPeriodStart).toLocaleDateString();
  const periodEnd = new Date(params.payPeriodEnd).toLocaleDateString();

  await createNotification({
    userId: staffInfo.authUserId,
    branchId: params.branchId,
    type: 'payroll',
    category: 'info',
    priority: 'high',
    title: '💰 Payroll Generated',
    message: `Your payroll for ${periodStart} - ${periodEnd} has been processed. Net amount: £${params.netPay.toFixed(2)}`,
    data: {
      payroll_id: params.payrollId,
      notification_type: 'payroll_generated',
      pay_period_start: params.payPeriodStart,
      pay_period_end: params.payPeriodEnd,
      net_pay: params.netPay,
      payment_status: params.paymentStatus,
    },
  });
}

/**
 * Notify staff when payroll is paid
 */
export async function notifyStaffPayrollPaid(params: {
  staffId: string;
  branchId: string;
  payrollId: string;
  netPay: number;
  paymentDate: string;
  paymentReference?: string;
}): Promise<void> {
  const staffInfo = await getStaffInfo(params.staffId);
  if (!staffInfo?.authUserId) return;

  const paymentDate = new Date(params.paymentDate).toLocaleDateString();

  await createNotification({
    userId: staffInfo.authUserId,
    branchId: params.branchId,
    type: 'payroll',
    category: 'success',
    priority: 'high',
    title: '✅ Payment Received',
    message: `Your payment of £${params.netPay.toFixed(2)} has been processed on ${paymentDate}${params.paymentReference ? ` (Ref: ${params.paymentReference})` : ''}`,
    data: {
      payroll_id: params.payrollId,
      notification_type: 'payroll_paid',
      net_pay: params.netPay,
      payment_date: params.paymentDate,
      payment_reference: params.paymentReference,
    },
  });
}

/**
 * Notify admins about care plan approval/rejection by client
 */
export async function notifyAdminsCarePlanApproval(params: {
  branchId: string;
  carePlanId: string;
  clientName: string;
  action: 'approved' | 'rejected';
  comments?: string;
}): Promise<void> {
  const adminIds = await getBranchAdminUserIds(params.branchId);
  
  if (adminIds.length === 0) {
    console.warn('[notificationHelpers] No admins found for branch:', params.branchId);
    return;
  }

  const title = params.action === 'approved' 
    ? '✅ Care Plan Approved by Client'
    : '📝 Care Plan Changes Requested';
  
  const message = params.action === 'approved'
    ? `${params.clientName} has approved their care plan`
    : `${params.clientName} has requested changes to their care plan${params.comments ? ': ' + params.comments.substring(0, 100) : ''}`;

  await createBulkNotifications(adminIds, {
    branchId: params.branchId,
    type: 'care_plan',
    category: params.action === 'approved' ? 'success' : 'info',
    priority: 'high',
    title,
    message,
    data: {
      care_plan_id: params.carePlanId,
      notification_type: params.action === 'approved' ? 'care_plan_client_approved' : 'care_plan_client_rejected',
      client_name: params.clientName,
      action: params.action,
      comments: params.comments,
    },
  });
}

/**
 * Notify client about invoice payment confirmation
 */
export async function notifyClientInvoicePayment(params: {
  clientId: string;
  branchId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountPaid: number;
  status: 'paid' | 'partially_paid';
}): Promise<void> {
  const clientAuthId = await getClientAuthUserId(params.clientId);
  if (!clientAuthId) return;

  const title = params.status === 'paid' 
    ? '✅ Invoice Paid in Full'
    : '💳 Payment Received';
  
  const message = params.status === 'paid'
    ? `Your invoice #${params.invoiceNumber} has been paid in full. Thank you!`
    : `Payment of £${params.amountPaid.toFixed(2)} received for invoice #${params.invoiceNumber}`;

  await createNotification({
    userId: clientAuthId,
    branchId: params.branchId,
    type: 'invoice',
    category: 'success',
    priority: 'medium',
    title,
    message,
    data: {
      invoice_id: params.invoiceId,
      invoice_number: params.invoiceNumber,
      notification_type: params.status === 'paid' ? 'invoice_paid' : 'invoice_partially_paid',
      amount_paid: params.amountPaid,
    },
  });
}

/**
 * Notify admins about new invoice created
 */
export async function notifyAdminsInvoiceCreated(params: {
  branchId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
}): Promise<void> {
  const adminIds = await getBranchAdminUserIds(params.branchId);
  if (adminIds.length === 0) return;

  await createBulkNotifications(adminIds, {
    branchId: params.branchId,
    type: 'invoice',
    category: 'info',
    priority: 'low',
    title: '📄 New Invoice Created',
    message: `Invoice #${params.invoiceNumber} created for ${params.clientName} (£${params.amount.toFixed(2)})`,
    data: {
      invoice_id: params.invoiceId,
      invoice_number: params.invoiceNumber,
      notification_type: 'invoice_created',
      client_name: params.clientName,
      amount: params.amount,
    },
  });
}
