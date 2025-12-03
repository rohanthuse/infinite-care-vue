/**
 * Centralized notification routing utility
 * Maps notification types to their target routes for Client and Carer portals
 */

import { Notification } from "@/hooks/useNotifications";

// Client portal route mappings
const CLIENT_ROUTES: Record<string, string> = {
  booking: '/appointments',
  appointment: '/appointments',
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
};

// Carer/Staff portal route mappings
const CARER_ROUTES: Record<string, string> = {
  booking: '/appointments',
  appointment: '/appointments',
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
  schedule: '/schedule',
  system: '',
};

export type UserContext = 'client' | 'carer' | 'branch' | 'unknown';

/**
 * Detect user context from the current URL path
 */
export const detectUserContext = (pathname: string): UserContext => {
  if (pathname.includes('/client-dashboard')) return 'client';
  if (pathname.includes('/carer-dashboard')) return 'carer';
  if (pathname.includes('/branch-dashboard')) return 'branch';
  return 'unknown';
};

/**
 * Get the appropriate route for a notification based on user context
 */
export const getNotificationRoute = (
  notification: Notification,
  userContext: UserContext
): string => {
  const routeMap = userContext === 'client' ? CLIENT_ROUTES : CARER_ROUTES;
  return routeMap[notification.type] || '';
};

/**
 * Store deep-linking data in sessionStorage for auto-opening
 */
export const storeDeepLinkData = (notification: Notification): void => {
  const data = notification.data as Record<string, any> | null;
  if (!data) return;

  // Clear previous deep-link data
  clearDeepLinkData();

  const notificationType = notification.type as string;

  // Store relevant IDs based on notification type
  if (notificationType === 'care_plan') {
    if (data.care_plan_id) {
      sessionStorage.setItem('openCarePlanId', data.care_plan_id);
    }
  } else if (notificationType === 'task' || notificationType === 'events_logs') {
    if (data.event_id) {
      sessionStorage.setItem('openEventId', data.event_id);
    }
    if (data.client_id) {
      sessionStorage.setItem('openEventClientId', data.client_id);
    }
  } else if (notificationType === 'message') {
    if (data.thread_id) {
      sessionStorage.setItem('openThreadId', data.thread_id);
    }
    if (data.conversation_id) {
      sessionStorage.setItem('openConversationId', data.conversation_id);
    }
  } else if (notificationType === 'document') {
    if (data.document_id) {
      sessionStorage.setItem('openDocumentId', data.document_id);
    }
  } else if (notificationType === 'form') {
    if (data.form_id) {
      sessionStorage.setItem('openFormId', data.form_id);
    }
    if (data.form_assignment_id) {
      sessionStorage.setItem('openFormAssignmentId', data.form_assignment_id);
    }
  } else if (notificationType === 'agreement') {
    if (data.agreement_id) {
      sessionStorage.setItem('openAgreementId', data.agreement_id);
    }
  } else if (notificationType === 'library') {
    if (data.resource_id) {
      sessionStorage.setItem('openResourceId', data.resource_id);
    }
  } else if (notificationType === 'training') {
    if (data.training_id) {
      sessionStorage.setItem('openTrainingId', data.training_id);
    }
    if (data.assignment_id) {
      sessionStorage.setItem('openTrainingAssignmentId', data.assignment_id);
    }
  } else if (notificationType === 'leave_request' || notificationType === 'leave') {
    if (data.leave_request_id) {
      sessionStorage.setItem('openLeaveRequestId', data.leave_request_id);
    }
  } else if (notificationType === 'booking' || notificationType === 'appointment') {
    if (data.booking_id) {
      sessionStorage.setItem('openBookingId', data.booking_id);
    }
    if (data.appointment_id) {
      sessionStorage.setItem('openAppointmentId', data.appointment_id);
    }
  } else if (notificationType === 'service_report') {
    if (data.report_id) {
      sessionStorage.setItem('openServiceReportId', data.report_id);
    }
  } else if (notificationType === 'medication' || notificationType === 'health') {
    if (data.medication_id) {
      sessionStorage.setItem('openMedicationId', data.medication_id);
    }
  } else if (notificationType === 'payment') {
    if (data.payment_id) {
      sessionStorage.setItem('openPaymentId', data.payment_id);
    }
    if (data.invoice_id) {
      sessionStorage.setItem('openInvoiceId', data.invoice_id);
    }
  } else if (notificationType === 'review') {
    if (data.review_id) {
      sessionStorage.setItem('openReviewId', data.review_id);
    }
  } else if (notificationType === 'client') {
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
    'openResourceId',
    'openTrainingId',
    'openTrainingAssignmentId',
    'openLeaveRequestId',
    'openBookingId',
    'openAppointmentId',
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
