/**
 * Centralized notification routing utility
 * Maps notification types to their target routes for Client and Carer portals
 */

import { Notification } from "@/hooks/useNotifications";

// Extended type mappings from data.notification_type to standard types
const EXTENDED_TYPES: Record<string, string> = {
  'library_resource': 'library',
  'document_upload': 'document',
  'document_shared': 'document',
  'client_document_upload': 'document',
  'staff_document_upload': 'staff_document',
  'agreement_assignment': 'agreement',
  'agreement_shared': 'agreement',
  'pending_agreement': 'agreement',
  'agreement_signed': 'agreement_signed',
  'tenant_agreement': 'tenant_agreement',
  'training_assignment': 'training',
  'training_status_update': 'training',
  'form_assignment': 'form',
  'form_submission': 'form_submission',
  'care_plan_update': 'care_plan',
  'care_plan_activation': 'care_plan',
  'care_plan_status': 'care_plan',
  'care_plan_client_approved': 'care_plan',
  'care_plan_client_rejected': 'care_plan',
  'booking_reminder': 'booking',
  'booking_update': 'booking',
  'booking_created_admin': 'booking',
  'booking_cancelled_admin': 'booking',
  'leave_request': 'leave',
  'leave_approved': 'leave',
  'leave_rejected': 'leave',
  'message_received': 'message',
  'new_message': 'message',
  'service_report_shared': 'service_report',
  'medication_reminder': 'medication',
  'health_update': 'health',
  'payment_due': 'payment',
  'invoice_generated': 'payment',
  'invoice_created': 'payment',
  'invoice_paid': 'payment',
  'invoice_partially_paid': 'payment',
  'review_request': 'review',
  'event_shared': 'events_logs',
  'task_assigned': 'task',
  'event_log': 'events_logs',
  // Meeting types
  'meeting_created': 'meeting',
  'meeting_updated': 'meeting',
  'meeting_cancelled': 'meeting',
  // Payroll types
  'payroll_generated': 'payroll',
  'payroll_paid': 'payroll',
};

// Organization dashboard route mappings
const ORG_ROUTES: Record<string, string> = {
  tenant_agreement: '/agreement',
  meeting: '/organization-calendar',
};

// Client portal route mappings
const CLIENT_ROUTES: Record<string, string> = {
  booking: '/appointments',
  appointment: '/appointments',
  meeting: '/appointments',
  care_plan: '/care-plans',
  task: '/events-logs',
  message: '/messages',
  medication: '/health-monitoring',
  document: '/documents',
  form: '/forms',
  agreement: '/agreements',
  library: '/library',
  service_report: '/service-reports',
  events_logs: '/events-logs',
  review: '/reviews',
  payment: '/payments',
  health: '/health-monitoring',
  schedule: '/schedule',
  system: '',
  info: '', // Generic info type - no specific route
};

// Carer/Staff portal route mappings
const CARER_ROUTES: Record<string, string> = {
  booking: '/appointments',
  appointment: '/appointments',
  meeting: '/appointments',
  care_plan: '/careplans',
  task: '/events-logs',
  message: '/messages',
  leave_request: '/leave',
  leave: '/leave',
  document: '/documents',
  form: '/forms',
  agreement: '/agreements',
  library: '/library',
  training: '/training',
  service_report: '/service-reports',
  events_logs: '/events-logs',
  client: '/clients',
  payment: '/payments',
  payroll: '/payments',
  invoice: '/payments',
  schedule: '/schedule',
  system: '',
  info: '', // Generic info type - no specific route
};

export type UserContext = 'client' | 'carer' | 'branch' | 'organization' | 'unknown';

/**
 * Get organization route for a notification type
 */
export const getOrgNotificationRoute = (notificationType: string): string => {
  return ORG_ROUTES[notificationType] || '';
};

/**
 * Detect user context from the current URL path
 */
export const detectUserContext = (pathname: string): UserContext => {
  if (pathname.includes('/client-dashboard')) return 'client';
  if (pathname.includes('/carer-dashboard')) return 'carer';
  if (pathname.includes('/branch-dashboard')) return 'branch';
  // Check for organization dashboard (tenant slug pattern without specific dashboards)
  if (pathname.match(/^\/[^/]+\/dashboard/) || pathname.match(/^\/[^/]+\/agreement/)) return 'organization';
  return 'unknown';
};

/**
 * Get the effective notification type by checking data.notification_type first
 */
export const getEffectiveNotificationType = (notification: Notification): string => {
  const data = notification.data as Record<string, any> | null;
  
  // First check data.notification_type
  const extendedType = data?.notification_type as string | undefined;
  
  if (extendedType) {
    // Map extended type to standard type, or use extendedType if no mapping exists
    const standardType = EXTENDED_TYPES[extendedType];
    if (standardType) {
      return standardType;
    }
    // Try using the extended type directly if it matches a route
    return extendedType;
  }
  
  // Fall back to notification.type
  return notification.type as string;
};

/**
 * Get the appropriate route for a notification based on user context
 */
export const getNotificationRoute = (
  notification: Notification,
  userContext: UserContext
): string => {
  const routeMap = userContext === 'client' ? CLIENT_ROUTES : CARER_ROUTES;
  const effectiveType = getEffectiveNotificationType(notification);
  
  console.log('[notificationRouting] getNotificationRoute:', {
    notificationType: notification.type,
    dataNotificationType: (notification.data as any)?.notification_type,
    effectiveType,
    userContext,
    route: routeMap[effectiveType] || ''
  });
  
  return routeMap[effectiveType] || '';
};

/**
 * Store deep-linking data in sessionStorage for auto-opening
 */
export const storeDeepLinkData = (notification: Notification): void => {
  const data = notification.data as Record<string, any> | null;
  if (!data) return;

  // Clear previous deep-link data
  clearDeepLinkData();

  // Get the effective notification type
  const effectiveType = getEffectiveNotificationType(notification);
  const extendedType = data.notification_type as string | undefined;
  
  console.log('[notificationRouting] storeDeepLinkData:', {
    effectiveType,
    extendedType,
    data
  });

  // Handle library/library_resource type
  if (effectiveType === 'library' || extendedType === 'library_resource') {
    if (data.resource_id) {
      sessionStorage.setItem('openResourceId', data.resource_id);
    }
  }
  // Handle document types
  else if (effectiveType === 'document' || extendedType === 'document_upload' || extendedType === 'document_shared') {
    if (data.document_id) {
      sessionStorage.setItem('openDocumentId', data.document_id);
    }
  }
  // Handle agreement types
  else if (effectiveType === 'agreement' || extendedType === 'agreement_assignment' || extendedType === 'agreement_shared' || extendedType === 'pending_agreement') {
    if (data.agreement_id) {
      sessionStorage.setItem('openAgreementId', data.agreement_id);
    }
  }
  // Handle tenant agreement types (organization-level)
  else if (effectiveType === 'tenant_agreement' || extendedType === 'tenant_agreement') {
    if (data.agreement_id) {
      sessionStorage.setItem('openTenantAgreementId', data.agreement_id);
    }
  }
  // Handle training types
  else if (effectiveType === 'training' || extendedType === 'training_assignment') {
    if (data.training_course_id || data.training_id || data.assignment_id) {
      sessionStorage.setItem('openTrainingId', data.training_course_id || data.training_id || data.assignment_id);
    }
  }
  // Handle form types
  else if (effectiveType === 'form' || extendedType === 'form_assignment') {
    if (data.form_id) {
      sessionStorage.setItem('openFormId', data.form_id);
    }
    if (data.form_assignment_id || data.assignment_id) {
      sessionStorage.setItem('openFormAssignmentId', data.form_assignment_id || data.assignment_id);
    }
  }
  // Handle care_plan types
  else if (effectiveType === 'care_plan') {
    if (data.care_plan_id) {
      sessionStorage.setItem('openCarePlanId', data.care_plan_id);
    }
  }
  // Handle task/events_logs types
  else if (effectiveType === 'task' || effectiveType === 'events_logs') {
    if (data.event_id) {
      sessionStorage.setItem('openEventId', data.event_id);
    }
    if (data.client_id) {
      sessionStorage.setItem('openEventClientId', data.client_id);
    }
  }
  // Handle message types
  else if (effectiveType === 'message') {
    if (data.thread_id) {
      sessionStorage.setItem('openThreadId', data.thread_id);
    }
    if (data.conversation_id) {
      sessionStorage.setItem('openConversationId', data.conversation_id);
    }
  }
  // Handle leave types
  else if (effectiveType === 'leave' || effectiveType === 'leave_request') {
    if (data.leave_request_id || data.leave_id) {
      sessionStorage.setItem('openLeaveRequestId', data.leave_request_id || data.leave_id);
    }
  }
  // Handle booking/appointment types
  else if (effectiveType === 'booking' || effectiveType === 'appointment') {
    if (data.booking_id) {
      sessionStorage.setItem('openBookingId', data.booking_id);
    }
    if (data.appointment_id) {
      sessionStorage.setItem('openAppointmentId', data.appointment_id);
    }
  }
  // Handle meeting types
  else if (effectiveType === 'meeting') {
    if (data.meeting_id) {
      sessionStorage.setItem('openMeetingId', data.meeting_id);
    }
  }
  // Handle service_report types
  else if (effectiveType === 'service_report') {
    if (data.report_id) {
      sessionStorage.setItem('openServiceReportId', data.report_id);
    }
  }
  // Handle medication/health types
  else if (effectiveType === 'medication' || effectiveType === 'health') {
    if (data.medication_id) {
      sessionStorage.setItem('openMedicationId', data.medication_id);
    }
  }
  // Handle payment types
  else if (effectiveType === 'payment') {
    if (data.payment_id) {
      sessionStorage.setItem('openPaymentId', data.payment_id);
    }
    if (data.invoice_id) {
      sessionStorage.setItem('openInvoiceId', data.invoice_id);
    }
  }
  // Handle review types
  else if (effectiveType === 'review') {
    if (data.review_id) {
      sessionStorage.setItem('openReviewId', data.review_id);
    }
  }
  // Handle client types
  else if (effectiveType === 'client') {
    if (data.client_id) {
      sessionStorage.setItem('openClientId', data.client_id);
    }
  }
};

/**
 * Clear all deep-link data from sessionStorage
 */
export const clearDeepLinkData = (): void => {
  const deepLinkKeys = [
    'openCarePlanId',
    'openEventId',
    'openEventClientId',
    'openThreadId',
    'openConversationId',
    'openDocumentId',
    'openFormId',
    'openFormAssignmentId',
    'openAgreementId',
    'openTenantAgreementId',
    'openResourceId',
    'openTrainingId',
    'openTrainingAssignmentId',
    'openLeaveRequestId',
    'openBookingId',
    'openAppointmentId',
    'openMeetingId',
    'openServiceReportId',
    'openMedicationId',
    'openPaymentId',
    'openInvoiceId',
    'openReviewId',
    'openClientId',
  ];
  
  deepLinkKeys.forEach(key => sessionStorage.removeItem(key));
};

/**
 * Get deep-link data for a specific type
 */
export const getDeepLinkData = (key: string): string | null => {
  return sessionStorage.getItem(key);
};

/**
 * Clear a specific deep-link key after it's been used
 */
export const clearDeepLinkKey = (key: string): void => {
  sessionStorage.removeItem(key);
};
