/**
 * Subscription plan limits and utilities
 */

export const SUBSCRIPTION_LIMITS: Record<string, number> = {
  '0-10': 10,
  '11-25': 25,
  '26-50': 50,
  '51-100': 100,
  '101-250': 250,
  '251-500': 500,
  '500+': 999999,
  'free': 10,
  'basic': 50,
  'professional': 150,
  'enterprise': 500,
};

/**
 * Get the maximum number of clients allowed for a subscription plan
 * Prefers max_users if explicitly set, otherwise derives from subscription_plan string
 */
export function getSubscriptionLimit(
  subscriptionPlan: string | null,
  maxUsers: number | null
): number {
  // If max_users is explicitly set, use that
  if (maxUsers !== null && maxUsers > 0) {
    return maxUsers;
  }

  // Otherwise, try to parse the subscription plan string
  if (subscriptionPlan) {
    const normalizedPlan = subscriptionPlan.toLowerCase().trim();
    
    // Check for exact matches in our limits map
    if (SUBSCRIPTION_LIMITS[normalizedPlan]) {
      return SUBSCRIPTION_LIMITS[normalizedPlan];
    }
    
    // Try case-insensitive matching
    for (const [key, value] of Object.entries(SUBSCRIPTION_LIMITS)) {
      if (key.toLowerCase() === normalizedPlan) {
        return value;
      }
    }
  }

  // Default to 50 if we can't determine the limit
  return 50;
}

/**
 * Format subscription plan name for display
 */
export function formatSubscriptionPlan(subscriptionPlan: string | null): string {
  if (!subscriptionPlan) return 'No Plan';
  
  const plan = subscriptionPlan.trim();
  
  // If it's a range format like \"0-10\", add \"Users\" suffix
  if (/^\d+-\d+$/.test(plan) || /^\d+\+$/.test(plan)) {
    return `${plan} Users Plan`;
  }
  
  // Otherwise capitalize it nicely
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase() + ' Plan';
}
