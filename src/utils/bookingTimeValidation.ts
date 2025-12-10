/**
 * Validates booking times to ensure data integrity
 * Prevents date mismatches where end_time date differs from start_time date
 */

export interface BookingTimeValidationResult {
  isValid: boolean;
  error?: string;
  correctedEndTime?: string;
}

/**
 * Validates that start_time and end_time are consistent
 * - end_time must be after start_time
 * - end_time date should match start_time date (same day bookings)
 * 
 * @param startTime - ISO string of booking start time
 * @param endTime - ISO string of booking end time
 * @returns Validation result with any errors or corrections
 */
export function validateBookingTimes(
  startTime: string,
  endTime: string
): BookingTimeValidationResult {
  const start = new Date(startTime);
  const end = new Date(endTime);

  // Check for invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return {
      isValid: false,
      error: 'Invalid date format for start_time or end_time',
    };
  }

  // Check end is after start
  if (end <= start) {
    return {
      isValid: false,
      error: 'End time must be after start time',
    };
  }

  // Check same date (for standard same-day bookings)
  const startDate = start.toISOString().split('T')[0];
  const endDate = end.toISOString().split('T')[0];

  if (startDate !== endDate) {
    console.warn(
      `[validateBookingTimes] ⚠️ Date mismatch detected: start=${startDate}, end=${endDate}`
    );
    
    // Auto-correct: keep the time portion of endTime but use startTime's date
    const endTimeOnly = end.toISOString().split('T')[1];
    const correctedEndTime = `${startDate}T${endTimeOnly}`;
    
    // Verify the corrected time is still after start
    const correctedEnd = new Date(correctedEndTime);
    if (correctedEnd <= start) {
      return {
        isValid: false,
        error: 'End time would be before or equal to start time after date correction. Please check your booking times.',
      };
    }
    
    return {
      isValid: true,
      correctedEndTime,
    };
  }

  return { isValid: true };
}

/**
 * Ensures booking times are valid, auto-correcting minor date mismatches
 * Throws an error if times cannot be validated
 * 
 * @param startTime - ISO string of booking start time
 * @param endTime - ISO string of booking end time
 * @returns Validated/corrected end time
 */
export function ensureValidBookingTimes(
  startTime: string,
  endTime: string
): { startTime: string; endTime: string } {
  const validation = validateBookingTimes(startTime, endTime);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid booking times');
  }

  if (validation.correctedEndTime) {
    console.log(
      `[ensureValidBookingTimes] Auto-corrected end_time from ${endTime} to ${validation.correctedEndTime}`
    );
    return {
      startTime,
      endTime: validation.correctedEndTime,
    };
  }

  return { startTime, endTime };
}
