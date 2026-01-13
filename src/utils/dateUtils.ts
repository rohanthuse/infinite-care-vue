import { parseISO, isValid, format } from 'date-fns';

/**
 * Safely parses a date value that may be a Date object or ISO string.
 * Returns undefined for invalid/null values.
 * Use this when handling form data that may come from database (ISO strings)
 * or from user input (Date objects).
 */
export const safeParseDateValue = (value: any): Date | undefined => {
  // Handle null, undefined, empty strings
  if (!value || value === '' || value === 'null' || value === 'undefined') return undefined;
  
  // Handle Date objects
  if (value instanceof Date) {
    return isValid(value) ? value : undefined;
  }
  
  // Handle string values
  if (typeof value === 'string') {
    try {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      
      const parsed = parseISO(trimmed);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  
  // Handle number (timestamp)
  if (typeof value === 'number') {
    try {
      const date = new Date(value);
      return isValid(date) ? date : undefined;
    } catch {
      return undefined;
    }
  }
  
  return undefined;
};

/**
 * Safely formats a date value with a fallback for invalid dates.
 * Use this wrapper around format() to prevent crashes from malformed date data.
 * @param value - The date value to format (Date, string, number, or null/undefined)
 * @param formatString - The format string for date-fns (e.g., "PPP", "yyyy-MM-dd")
 * @param fallback - The fallback string to return if date is invalid (default: "Pick date")
 * @returns Formatted date string or fallback
 */
export const safeFormatDate = (
  value: any,
  formatString: string,
  fallback: string = "Pick date"
): string => {
  try {
    const parsedDate = safeParseDateValue(value);
    if (!parsedDate) return fallback;
    return format(parsedDate, formatString);
  } catch (error) {
    console.warn('[safeFormatDate] Failed to format date:', value, error);
    return fallback;
  }
};
