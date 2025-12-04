// Organization-level notification types (visible at org dashboard only)
export const ORG_LEVEL_NOTIFICATION_TYPES = [
  'demo_request',
  'system',
  'subscription',
  'organization_member',
  'training_metrics',
  'org_announcement',
];

// Branch-level notification types (visible only in branch context)
export const BRANCH_LEVEL_NOTIFICATION_TYPES = [
  'booking',
  'care_plan',
  'message',
  'medication',
  'task',
  'service_report',
  'leave_request',
  'pending_agreement',
  'form',
  'form_submission',
  'document',
  'client_document_upload',
  'staff_document_upload',
  'library',
  'training',
  'agreement_signed',
];

// Helper to check if a notification type belongs to organization level
export const isOrgLevelNotificationType = (type: string): boolean => {
  return ORG_LEVEL_NOTIFICATION_TYPES.includes(type);
};

// Helper to check if a notification type belongs to branch level
export const isBranchLevelNotificationType = (type: string): boolean => {
  return BRANCH_LEVEL_NOTIFICATION_TYPES.includes(type);
};
