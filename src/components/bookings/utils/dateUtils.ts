/**
 * Enhanced date utilities for booking system
 * All functions work with date strings in YYYY-MM-DD format
 * Uses UTC internally to avoid timezone conversion issues
 */

// Constants for day-of-week mapping
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NUMBERS = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

/**
 * Convert date string to day of week (0 = Sunday, 6 = Saturday)
 * Uses UTC to prevent timezone-related shifts
 */
export function getDayOfWeekFromDateString(dateString: string): number {
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  return utcDate.getUTCDay();
}

/**
 * Add days to a date string, returning new date string
 */
export function addDaysToDateString(dateString: string, days: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  
  const resultYear = utcDate.getUTCFullYear();
  const resultMonth = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const resultDay = String(utcDate.getUTCDate()).padStart(2, '0');
  
  return `${resultYear}-${resultMonth}-${resultDay}`;
}

/**
 * Create booking datetime string from date and time components
 */
export function createBookingDateTime(dateString: string, timeString: string): string {
  const dateStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  const [h, m] = timeString.split(':');
  const formattedHour = h.padStart(2, '0');
  const formattedMinute = m.padStart(2, '0');
  
  return `${dateStr}T${formattedHour}:${formattedMinute}:00`;
}

/**
 * Validate date string format and value
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && 
           date.getUTCMonth() === month - 1 && 
           date.getUTCDate() === day;
  } catch {
    return false;
  }
}

/**
 * Find all dates matching a specific day of week within a date range
 */
export function findDatesForDayOfWeek(
  startDate: string, 
  endDate: string, 
  targetDayOfWeek: number, 
  intervalWeeks: number = 1
): string[] {
  if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
    throw new Error('Invalid date range provided');
  }
  
  if (targetDayOfWeek < 0 || targetDayOfWeek > 6) {
    throw new Error('Day of week must be between 0 (Sunday) and 6 (Saturday)');
  }
  
  if (intervalWeeks < 1) {
    throw new Error('Interval weeks must be at least 1');
  }
  
  const dates: string[] = [];
  let currentDate = startDate;
  
  // Find first occurrence of target day
  const maxSearchDays = 7;
  let searchAttempts = 0;
  
  while (currentDate <= endDate && searchAttempts < maxSearchDays) {
    const dayOfWeek = getDayOfWeekFromDateString(currentDate);
    
    if (dayOfWeek === targetDayOfWeek) {
      // Found first occurrence, now add all recurring dates
      while (currentDate <= endDate) {
        dates.push(currentDate);
        
        // Add interval weeks (7 days per week)
        const nextDate = addDaysToDateString(currentDate, intervalWeeks * 7);
        
        // Verify the next date maintains the same day of week
        if (nextDate <= endDate) {
          const nextDayOfWeek = getDayOfWeekFromDateString(nextDate);
          if (nextDayOfWeek !== targetDayOfWeek) {
            console.error(`Day-of-week mismatch: expected ${targetDayOfWeek}, got ${nextDayOfWeek} for date ${nextDate}`);
            break;
          }
        }
        
        currentDate = nextDate;
      }
      break;
    }
    
    currentDate = addDaysToDateString(currentDate, 1);
    searchAttempts++;
  }
  
  return dates;
}

/**
 * Convert day selection object to array of day numbers
 */
export function convertDaySelectionToNumbers(daySelection: {
  sun?: boolean;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
}): number[] {
  const selectedDays: number[] = [];
  
  if (daySelection.sun) selectedDays.push(0);
  if (daySelection.mon) selectedDays.push(1);
  if (daySelection.tue) selectedDays.push(2);
  if (daySelection.wed) selectedDays.push(3);
  if (daySelection.thu) selectedDays.push(4);
  if (daySelection.fri) selectedDays.push(5);
  if (daySelection.sat) selectedDays.push(6);
  
  return selectedDays.sort();
}

/**
 * Validate time string format (HH:MM)
 */
export function isValidTimeString(timeString: string): boolean {
  if (!timeString || typeof timeString !== 'string') {
    return false;
  }
  
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(timeString);
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  return isValidDateString(startDate) && 
         isValidDateString(endDate) && 
         startDate <= endDate;
}