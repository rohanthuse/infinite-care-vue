/**
 * Backdating policy configuration for bookings
 * This module manages when backdated bookings are allowed
 */

// Configurable settings for backdating
interface BackdatingPolicyConfig {
  allowBackdating: boolean;
  allowToday: boolean;
  maxBackdatingDays?: number; // Optional: limit how far back
  reasonRequired?: boolean; // Optional: require reason for backdated bookings
}

// Default policy - can be overridden by environment or user settings
const DEFAULT_POLICY: BackdatingPolicyConfig = {
  allowBackdating: true, // Allow backdated bookings by default
  allowToday: true,
  maxBackdatingDays: undefined, // No limit
  reasonRequired: false,
};

/**
 * Get current backdating policy
 * In the future, this could be enhanced to:
 * - Read from environment variables
 * - Read from user/organization settings
 * - Read from database configuration
 */
export function getBackdatingPolicy(): BackdatingPolicyConfig {
  // For now, return default policy
  // TODO: Enhanced to read from settings/env vars
  return DEFAULT_POLICY;
}

/**
 * Check if a date is allowed based on backdating policy
 */
export function isDateAllowed(date: Date, policy?: BackdatingPolicyConfig): boolean {
  const currentPolicy = policy || getBackdatingPolicy();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  
  // Check if date is today
  if (inputDate.getTime() === today.getTime()) {
    return currentPolicy.allowToday;
  }
  
  // Check if date is in the future (always allowed)
  if (inputDate > today) {
    return true;
  }
  
  // Check if date is in the past
  if (inputDate < today) {
    if (!currentPolicy.allowBackdating) {
      return false;
    }
    
    // Check max backdating days limit
    if (currentPolicy.maxBackdatingDays !== undefined) {
      const daysDiff = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= currentPolicy.maxBackdatingDays;
    }
    
    return true; // No limit, allow any past date
  }
  
  return true;
}

/**
 * Get validation message for invalid dates
 */
export function getDateValidationMessage(date: Date, fieldName: string = "Date", policy?: BackdatingPolicyConfig): string | null {
  const currentPolicy = policy || getBackdatingPolicy();
  
  if (isDateAllowed(date, currentPolicy)) {
    return null; // Date is valid
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);
  
  if (inputDate.getTime() === today.getTime() && !currentPolicy.allowToday) {
    return `${fieldName} cannot be today`;
  }
  
  if (inputDate < today && !currentPolicy.allowBackdating) {
    return `${fieldName} cannot be in the past`;
  }
  
  if (inputDate < today && currentPolicy.maxBackdatingDays !== undefined) {
    const daysDiff = Math.floor((today.getTime() - inputDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > currentPolicy.maxBackdatingDays) {
      return `${fieldName} cannot be more than ${currentPolicy.maxBackdatingDays} days in the past`;
    }
  }
  
  return `${fieldName} is not allowed`;
}

/**
 * Create a disabled function for date pickers based on policy
 */
export function createDateDisabledFunction(policy?: BackdatingPolicyConfig) {
  const currentPolicy = policy || getBackdatingPolicy();
  
  return (date: Date): boolean => {
    return !isDateAllowed(date, currentPolicy);
  };
}