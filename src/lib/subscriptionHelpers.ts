/**
 * Subscription Management Utilities
 * Handles subscription plan parsing, limits, and formatting
 */

export type SubscriptionPlan = '0-10' | '11-25' | '26-50' | '51-100' | '101-250' | '251-500' | '500+' | 'basic' | string;

/**
 * Get the maximum client limit for a subscription plan
 */
export function getSubscriptionLimit(plan: string): number {
  const planMap: Record<string, number> = {
    '0-10': 10,
    '11-25': 25,
    '26-50': 50,
    '51-100': 100,
    '101-250': 250,
    '251-500': 500,
    '500+': 999999, // Effectively unlimited
    'basic': 50, // Legacy plan
  };

  return planMap[plan] || 50; // Default to 50 if plan is unknown
}

/**
 * Format subscription plan name for display
 */
export function formatSubscriptionPlan(plan: string): string {
  if (plan === 'basic') return 'Basic Plan';
  if (plan === '500+') return '500+ Users Plan';
  if (plan.includes('-')) return `${plan} Users Plan`;
  
  return plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
}

/**
 * Calculate remaining client slots
 */
export function getRemainingSlots(currentCount: number, limit: number): number {
  return Math.max(0, limit - currentCount);
}

/**
 * Check if organization is at subscription limit
 */
export function isAtSubscriptionLimit(currentCount: number, plan: string): boolean {
  const limit = getSubscriptionLimit(plan);
  return currentCount >= limit;
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(currentCount: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min(100, (currentCount / limit) * 100);
}

/**
 * Get color indicator based on usage percentage
 */
export function getUsageColor(percentage: number): 'success' | 'warning' | 'destructive' {
  if (percentage >= 90) return 'destructive';
  if (percentage >= 70) return 'warning';
  return 'success';
}

/**
 * Check if organization should see upgrade prompt
 */
export function shouldShowUpgradePrompt(currentCount: number, limit: number): boolean {
  const remaining = getRemainingSlots(currentCount, limit);
  return remaining <= 3 || currentCount >= limit;
}
