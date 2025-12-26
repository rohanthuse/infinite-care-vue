/**
 * Shared constants for care plan statuses used across the application.
 * Ensures consistent filtering of active/valid care plans.
 */

export const ACTIVE_CARE_PLAN_STATUSES = [
  'draft',
  'pending_approval',
  'pending_client_approval',
  'active',
  'approved',
  'confirmed',
] as const;

export type ActiveCarePlanStatus = typeof ACTIVE_CARE_PLAN_STATUSES[number];

/**
 * Check if a care plan status is considered "active" for service report purposes
 */
export const isActiveCarePlanStatus = (status: string): boolean => {
  return ACTIVE_CARE_PLAN_STATUSES.includes(status as ActiveCarePlanStatus);
};
