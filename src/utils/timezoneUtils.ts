import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Get the user's current timezone (e.g., "Asia/Kolkata", "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convert local date/time to UTC ISO string for database storage
 * 
 * Example: User in IST enters "2025-10-30" at "09:00"
 * - Creates local time: 2025-10-30T09:00:00 IST
 * - Converts to UTC: 2025-10-30T03:30:00.000Z
 * - Database stores: 2025-10-30 03:30:00+00
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @param timeString - Time in HH:MM format
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns ISO 8601 string in UTC (e.g., "2025-10-30T03:30:00.000Z")
 */
export function createUTCTimestamp(
  dateString: string, 
  timeString: string, 
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  
  // Create a local date/time string
  const localDateTimeString = `${dateString}T${timeString}:00`;
  const localDateTime = new Date(localDateTimeString);
  
  // Convert from local timezone to UTC
  const utcDateTime = fromZonedTime(localDateTime, tz);
  
  console.log('[timezoneUtils] Local → UTC conversion:', {
    input: localDateTimeString,
    timezone: tz,
    localDateTime: localDateTime.toISOString(),
    utcResult: utcDateTime.toISOString()
  });
  
  return utcDateTime.toISOString();
}

/**
 * Format a UTC timestamp for display in user's local timezone
 * 
 * Example: Database has "2025-10-30T03:30:00.000Z"
 * - User in IST sees: "09:00"
 * - User in EST sees: "23:30" (previous day)
 * 
 * @param utcTimestamp - UTC timestamp from database
 * @param formatString - date-fns format string (default: 'HH:mm')
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Formatted time string in local timezone
 */
export function formatInUserTimezone(
  utcTimestamp: string | Date, 
  formatString: string = 'HH:mm',
  timezone?: string
): string {
  const tz = timezone || getUserTimezone();
  const utcDate = typeof utcTimestamp === 'string' 
    ? new Date(utcTimestamp) 
    : utcTimestamp;
  
  // Convert from UTC to local timezone
  const localDate = toZonedTime(utcDate, tz);
  
  return format(localDate, formatString);
}

/**
 * Check if two timestamps overlap (timezone-aware)
 * 
 * @param start1 - First event start time (UTC or Date)
 * @param end1 - First event end time (UTC or Date)
 * @param start2 - Second event start time (UTC or Date)
 * @param end2 - Second event end time (UTC or Date)
 * @returns true if events overlap, false otherwise
 */
export function doTimesOverlap(
  start1: string | Date,
  end1: string | Date,
  start2: string | Date,
  end2: string | Date
): boolean {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;
  
  return s1 < e2 && s2 < e1;
}

/**
 * Get the timezone offset in hours (for display purposes)
 * 
 * @param timezone - Optional timezone (defaults to user's timezone)
 * @returns Offset string like "+05:30" or "-08:00"
 */
export function getTimezoneOffset(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const now = new Date();
  
  // Get offset in minutes
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    timeZoneName: 'longOffset'
  });
  
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(part => part.type === 'timeZoneName');
  
  if (offsetPart && offsetPart.value.includes('GMT')) {
    return offsetPart.value.replace('GMT', '');
  }
  
  return '';
}
