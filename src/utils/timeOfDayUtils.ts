/**
 * Utility functions for determining time of day from timestamps
 * and filtering medications based on scheduled times.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Time ranges for each part of the day
 * - Morning: 5:00 AM - 11:59 AM
 * - Afternoon: 12:00 PM - 4:59 PM
 * - Evening: 5:00 PM - 8:59 PM
 * - Night: 9:00 PM - 4:59 AM (wraps around midnight)
 */
export const TIME_OF_DAY_RANGES = {
  morning: { start: 5, end: 11 },
  afternoon: { start: 12, end: 16 },
  evening: { start: 17, end: 20 },
  night: { start: 21, end: 4 },
};

/**
 * Determines the time of day from a given timestamp
 * @param timestamp - ISO string or Date object
 * @returns The time of day category
 */
export function getTimeOfDayFromTimestamp(timestamp: string | Date): TimeOfDay {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const hour = date.getHours();
  
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night'; // 21-23 or 0-4
}

/**
 * Checks if a medication's scheduled time of day matches the visit's time of day
 * @param medicationTimeOfDay - Array of time of day strings from the medication (e.g., ['morning', 'evening'])
 * @param visitTimeOfDay - The time of day category for the current visit
 * @returns true if the medication should be shown for this visit time
 */
export function doesMedicationMatchTimeOfDay(
  medicationTimeOfDay: string[] | null | undefined,
  visitTimeOfDay: TimeOfDay
): boolean {
  // If no time_of_day specified, show the medication (backward compatibility)
  if (!medicationTimeOfDay || medicationTimeOfDay.length === 0) {
    return true;
  }
  
  // Check if the visit's time of day matches any of the medication's scheduled times
  return medicationTimeOfDay.includes(visitTimeOfDay);
}

/**
 * Get a human-readable label for a time of day
 * @param timeOfDay - The time of day category
 * @returns Human-readable label
 */
export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  };
  return labels[timeOfDay];
}
