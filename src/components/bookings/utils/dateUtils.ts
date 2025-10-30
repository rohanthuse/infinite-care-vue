/**
 * Enhanced date utilities for booking system
 * All functions work with date strings in YYYY-MM-DD format
 * Uses UTC internally to avoid timezone conversion issues
 */

import { createUTCTimestamp } from '@/utils/timezoneUtils';

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
 * Uses timezone-aware conversion to ensure bookings display at correct times
 */
export function createBookingDateTime(dateString: string, timeString: string): string {
  console.log('[createBookingDateTime] Input dateString:', dateString);
  console.log('[createBookingDateTime] Input timeString:', timeString);
  
  // Extract date if it includes time component
  const dateStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  
  // Use timezone-aware conversion utility to convert local time to UTC
  const result = createUTCTimestamp(dateStr, timeString);
  
  console.log('[createBookingDateTime] Created timezone-aware UTC timestamp:', result);
  
  return result;
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
 * Supports both flat structure (sat: true) and nested structure (days: { sat: true })
 */
export function convertDaySelectionToNumbers(daySelection: {
  sun?: boolean;
  mon?: boolean;
  tue?: boolean;
  wed?: boolean;
  thu?: boolean;
  fri?: boolean;
  sat?: boolean;
} | any): number[] {
  console.log('[convertDaySelectionToNumbers] Converting day selection:', daySelection);
  
  // Handle null/undefined input
  if (!daySelection || typeof daySelection !== 'object') {
    console.log('[convertDaySelectionToNumbers] Invalid or empty day selection, returning empty array');
    return [];
  }

  const selectedDays: number[] = [];
  
  // Robust handling - check both direct properties and nested days object
  const days = daySelection.days || daySelection; // Support both flat and nested structures
  
  if (days.sun) selectedDays.push(0);
  if (days.mon) selectedDays.push(1);
  if (days.tue) selectedDays.push(2);
  if (days.wed) selectedDays.push(3);
  if (days.thu) selectedDays.push(4);
  if (days.fri) selectedDays.push(5);
  if (days.sat) selectedDays.push(6);
  
  console.log('[convertDaySelectionToNumbers] Selected day numbers:', selectedDays.map(d => 
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
  ));
  
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
 * Format date for booking storage (timezone-safe)
 * Converts Date object to YYYY-MM-DD format using local timezone methods
 * This preserves the exact date selected by the user without timezone conversion
 */
export function formatDateForBooking(date: Date): string {
  console.log('[formatDateForBooking] Input date:', date);
  console.log('[formatDateForBooking] Input date toString:', date.toString());
  console.log('[formatDateForBooking] Input date toDateString:', date.toDateString());
  
  // Use local timezone methods to preserve the user-selected date
  // This prevents the common "off by one day" bug when dates cross timezone boundaries
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const result = `${year}-${month}-${day}`;
  console.log('[formatDateForBooking] Formatted result:', result);
  
  return result;
}

/**
 * Validate date range
 */
export function isValidDateRange(startDate: string, endDate: string): boolean {
  return isValidDateString(startDate) && 
         isValidDateString(endDate) && 
         startDate <= endDate;
}