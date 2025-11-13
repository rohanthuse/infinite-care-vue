import { format } from 'date-fns';

/**
 * Safely formats a date value, returning a fallback if the date is invalid
 * @param dateValue - The date value to format (string, Date, or null/undefined)
 * @param formatString - The format string for date-fns
 * @param fallback - The fallback value to return if date is invalid (default: 'N/A')
 * @returns Formatted date string or fallback
 */
export const formatSafeDate = (
  dateValue: any,
  formatString: string,
  fallback: string = 'N/A'
): string => {
  try {
    // Check if value exists and is not empty
    if (!dateValue || dateValue === '') {
      return fallback;
    }
    
    // Create Date object
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('[formatSafeDate] Invalid date value:', dateValue);
      return fallback;
    }
    
    // Format the valid date
    return format(date, formatString);
  } catch (error) {
    console.error('[formatSafeDate] Error formatting date:', dateValue, error);
    return fallback;
  }
};
