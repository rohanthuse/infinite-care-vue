import { parseISO, isValid } from 'date-fns';

/**
 * Safely parses a date value that may be a Date object or ISO string.
 * Returns undefined for invalid/null values.
 * Use this when handling form data that may come from database (ISO strings)
 * or from user input (Date objects).
 */
export const safeParseDateValue = (value: any): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date && isValid(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = parseISO(value);
      return isValid(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};
