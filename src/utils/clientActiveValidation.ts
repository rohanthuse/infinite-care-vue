/**
 * Client Active Period Validation Utilities
 * 
 * These utilities validate bookings against client's active_until date
 * to prevent bookings from being created after a client becomes inactive.
 */

import { format } from 'date-fns';

export interface ClientActiveValidationResult {
  isValid: boolean;
  error?: string;
  inactiveDate?: string;
}

/**
 * Format a date for display (DD/MM/YYYY)
 */
function formatDateForDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Validate if a booking date is within client's active period
 * 
 * @param bookingDate - The date of the proposed booking
 * @param activeUntil - The client's active_until date (YYYY-MM-DD format)
 * @returns Validation result with isValid flag and error message if invalid
 */
export function validateBookingAgainstClientActiveDate(
  bookingDate: Date | string,
  activeUntil: string | null | undefined
): ClientActiveValidationResult {
  // No restriction if no active_until is set
  if (!activeUntil) {
    return { isValid: true };
  }

  // Normalize booking date to YYYY-MM-DD string
  let bookingDateStr: string;
  if (typeof bookingDate === 'string') {
    // Handle ISO string or date-only string
    bookingDateStr = bookingDate.includes('T') 
      ? bookingDate.split('T')[0] 
      : bookingDate;
  } else {
    // Date object - extract local date components to avoid timezone issues
    const year = bookingDate.getFullYear();
    const month = String(bookingDate.getMonth() + 1).padStart(2, '0');
    const day = String(bookingDate.getDate()).padStart(2, '0');
    bookingDateStr = `${year}-${month}-${day}`;
  }

  // Normalize active_until to YYYY-MM-DD
  const activeUntilStr = activeUntil.includes('T') 
    ? activeUntil.split('T')[0] 
    : activeUntil;

  // Compare dates as strings (YYYY-MM-DD format allows string comparison)
  if (bookingDateStr > activeUntilStr) {
    return {
      isValid: false,
      error: `This client is inactive from ${formatDateForDisplay(activeUntilStr)}.\nBookings cannot be created after the inactive date.`,
      inactiveDate: activeUntilStr
    };
  }

  return { isValid: true };
}

/**
 * Validate if any date in a range exceeds the client's active_until date
 * Useful for recurring bookings
 * 
 * @param fromDate - Start of the booking range
 * @param untilDate - End of the booking range
 * @param activeUntil - The client's active_until date
 * @returns Validation result
 */
export function validateDateRangeAgainstClientActiveDate(
  fromDate: Date | string,
  untilDate: Date | string,
  activeUntil: string | null | undefined
): ClientActiveValidationResult {
  // No restriction if no active_until is set
  if (!activeUntil) {
    return { isValid: true };
  }

  // Validate the end date (untilDate) against active_until
  return validateBookingAgainstClientActiveDate(untilDate, activeUntil);
}

/**
 * Check if a client is currently inactive based on status or active_until date
 * 
 * @param status - The client's current status
 * @param activeUntil - The client's active_until date
 * @returns True if the client is currently inactive
 */
export function isClientCurrentlyInactive(
  status: string | undefined,
  activeUntil: string | null | undefined
): boolean {
  // Check explicit inactive status
  if (status === 'Inactive') {
    return true;
  }

  // Check if active_until has passed
  if (!activeUntil) {
    return false;
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const activeUntilStr = activeUntil.includes('T') ? activeUntil.split('T')[0] : activeUntil;

  return activeUntilStr < todayStr;
}

/**
 * Get the formatted inactive date message for tooltips/badges
 */
export function getClientInactiveMessage(activeUntil: string | null | undefined): string {
  if (!activeUntil) {
    return 'Client is inactive';
  }
  return `Client inactive from ${formatDateForDisplay(activeUntil)}`;
}
