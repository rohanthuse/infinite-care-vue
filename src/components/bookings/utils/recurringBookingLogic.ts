/**
 * Enhanced recurring booking logic
 */

import { 
  findDatesForDayOfWeek, 
  convertDaySelectionToNumbers, 
  createBookingDateTime,
  isValidDateString,
  isValidTimeString,
  formatDateForBooking 
} from './dateUtils';
import { validateBookingFormData, type BookingFormData } from './bookingValidation';
import { CreateBookingInput } from '@/data/hooks/useCreateBooking';

export interface RecurringBookingResult {
  success: boolean;
  bookings: CreateBookingInput[];
  errors: string[];
  warnings: string[];
  summary: {
    totalBookings: number;
    dateRange: { start: string; end: string };
    selectedDays: number[];
    recurrenceWeeks: number;
  };
}

/**
 * Generate recurring bookings from form data
 */
export function generateRecurringBookings(
  bookingData: BookingFormData,
  branchId: string
): RecurringBookingResult {
  console.log('[generateRecurringBookings] Starting generation with data:', bookingData);
  
  // Validate input data
  const validation = validateBookingFormData(bookingData);
  if (!validation.isValid) {
    return {
      success: false,
      bookings: [],
      errors: validation.errors,
      warnings: validation.warnings,
      summary: {
        totalBookings: 0,
        dateRange: { start: '', end: '' },
        selectedDays: [],
        recurrenceWeeks: 0
      }
    };
  }

  // CRITICAL FIX: Use timezone-safe date conversion to prevent September 11th -> September 10th bug
  console.log('[generateRecurringBookings] ⚠️  DEBUGGING DATE CONVERSION BUG');
  console.log('[generateRecurringBookings] Raw fromDate input:', bookingData.fromDate);
  console.log('[generateRecurringBookings] Raw fromDate type:', typeof bookingData.fromDate);
  console.log('[generateRecurringBookings] Raw untilDate input:', bookingData.untilDate);
  console.log('[generateRecurringBookings] Raw untilDate type:', typeof bookingData.untilDate);
  
  // Use timezone-safe formatDateForBooking function instead of toISOString() to prevent date shifts
  const fromDateStr = typeof bookingData.fromDate === 'string' 
    ? (bookingData.fromDate.includes('T') ? bookingData.fromDate.split('T')[0] : bookingData.fromDate)
    : formatDateForBooking(bookingData.fromDate);
    
  const untilDateStr = typeof bookingData.untilDate === 'string' 
    ? (bookingData.untilDate.includes('T') ? bookingData.untilDate.split('T')[0] : bookingData.untilDate)
    : formatDateForBooking(bookingData.untilDate);
    
  console.log('[generateRecurringBookings] ✅ TIMEZONE-SAFE fromDateStr:', fromDateStr);
  console.log('[generateRecurringBookings] ✅ TIMEZONE-SAFE untilDateStr:', untilDateStr);

  const recurrenceWeeks = parseInt(bookingData.recurrenceFrequency || "1");
  const bookingsToCreate: CreateBookingInput[] = [];
  const errors: string[] = [];
  const warnings: string[] = validation.warnings;

  console.log('[generateRecurringBookings] Processing date range:', { fromDateStr, untilDateStr, recurrenceWeeks });

  // Process each schedule
  for (const [scheduleIndex, schedule] of bookingData.schedules.entries()) {
    console.log(`[generateRecurringBookings] Processing schedule ${scheduleIndex + 1}:`, schedule);

    const { startTime, endTime, days, services } = schedule;

    // Validate schedule times
    if (!isValidTimeString(startTime) || !isValidTimeString(endTime)) {
      errors.push(`Schedule ${scheduleIndex + 1}: Invalid time format`);
      continue;
    }

    // Get service ID if provided
    let serviceId: string | null = null;
    if (services && services.length > 0 && /^[0-9a-fA-F-]{36}$/.test(services[0])) {
      serviceId = services[0];
    }

    // Convert day selection to numbers
    const selectedDays = days ? convertDaySelectionToNumbers(days) : [0, 1, 2, 3, 4, 5, 6];
    
    if (selectedDays.length === 0) {
      console.log(`[generateRecurringBookings] WARNING: Schedule ${scheduleIndex + 1} has no days selected, checking for flat structure...`);
      
      // Try to extract days from flat structure as fallback
      const scheduleAny = schedule as any; // Type assertion for flat day properties
      const flatDays = {
        sun: scheduleAny.sun || false,
        mon: scheduleAny.mon || false,
        tue: scheduleAny.tue || false,
        wed: scheduleAny.wed || false,
        thu: scheduleAny.thu || false,
        fri: scheduleAny.fri || false,
        sat: scheduleAny.sat || false,
      };
      
      const flatSelectedDays = convertDaySelectionToNumbers(flatDays);
      console.log(`[generateRecurringBookings] Extracted ${flatSelectedDays.length} days from flat structure:`, 
        flatSelectedDays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]));
      
      if (flatSelectedDays.length > 0) {
        selectedDays.push(...flatSelectedDays);
      } else {
        warnings.push(`Schedule ${scheduleIndex + 1}: No days selected, defaulting to all days`);
        selectedDays.push(0, 1, 2, 3, 4, 5, 6);
      }
    }

    console.log(`[generateRecurringBookings] Selected days for schedule ${scheduleIndex + 1}:`, selectedDays.map(d => 
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]
    ));

    // Generate bookings for each selected day
    for (const dayOfWeek of selectedDays) {
      console.log(`[generateRecurringBookings] Generating bookings for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]} (${dayOfWeek})`);
      
      try {
        const matchingDates = findDatesForDayOfWeek(
          fromDateStr,
          untilDateStr,
          dayOfWeek,
          recurrenceWeeks
        );

        console.log(`[generateRecurringBookings] Found ${matchingDates.length} matching dates:`, matchingDates);

        for (const date of matchingDates) {
          const startDateTime = createBookingDateTime(date, startTime);
          const endDateTime = createBookingDateTime(date, endTime);

          console.log(`[generateRecurringBookings] 🎯 CREATING BOOKING FOR DATE: ${date} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]})`);
          console.log(`[generateRecurringBookings] 🎯 BOOKING DETAILS:`, {
            originalDate: date,
            dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
            startTime,
            endTime,
            startDateTime,
            endDateTime
          });
          
          // Validate that the created booking is actually for the intended date
          const bookingDateCheck = startDateTime.split('T')[0];
          if (bookingDateCheck !== date) {
            console.error(`[generateRecurringBookings] ❌ DATE MISMATCH! Expected ${date}, got ${bookingDateCheck}`);
          } else {
            console.log(`[generateRecurringBookings] ✅ DATE CONSISTENCY VERIFIED: ${date} matches ${bookingDateCheck}`);
          }

          bookingsToCreate.push({
            branch_id: branchId,
            client_id: bookingData.clientId || '',
            staff_id: bookingData.carerId || undefined,
            start_time: startDateTime,
            end_time: endDateTime,
            service_id: serviceId || null,
            revenue: null,
            status: bookingData.carerId ? "assigned" : "unassigned",
            notes: bookingData.notes || null,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Schedule ${scheduleIndex + 1}, ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}: ${errorMessage}`);
        console.error(`[generateRecurringBookings] Error generating bookings for day ${dayOfWeek}:`, error);
      }
    }
  }

  const result: RecurringBookingResult = {
    success: errors.length === 0 && bookingsToCreate.length > 0,
    bookings: bookingsToCreate,
    errors,
    warnings,
    summary: {
      totalBookings: bookingsToCreate.length,
      dateRange: { start: fromDateStr, end: untilDateStr },
      selectedDays: bookingData.schedules.flatMap(s => 
        s.days ? convertDaySelectionToNumbers(s.days) : []
      ).filter((v, i, a) => a.indexOf(v) === i).sort(),
      recurrenceWeeks
    }
  };

  console.log('[generateRecurringBookings] Generation complete:', result);
  return result;
}

/**
 * Preview recurring bookings without creating them
 */
export function previewRecurringBookings(
  bookingData: BookingFormData,
  branchId: string
): { 
  dates: string[]; 
  totalBookings: number; 
  errors: string[];
  dayBreakdown: Array<{ day: string; dates: string[] }>;
} {
  const result = generateRecurringBookings(bookingData, branchId);
  
  if (!result.success) {
    return { 
      dates: [], 
      totalBookings: 0, 
      errors: result.errors,
      dayBreakdown: []
    };
  }

  // Extract unique dates and sort them
  const uniqueDates = [...new Set(result.bookings.map(b => b.start_time.split('T')[0]))].sort();
  
  // Group by day of week for breakdown
  const dayBreakdown = [0, 1, 2, 3, 4, 5, 6].map(dayNum => {
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayNum];
    const dayDates = result.bookings
      .filter(b => {
        const date = b.start_time.split('T')[0];
        const [year, month, day] = date.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        return utcDate.getUTCDay() === dayNum;
      })
      .map(b => b.start_time.split('T')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    
    return { day: dayName, dates: dayDates };
  }).filter(d => d.dates.length > 0);

  return {
    dates: uniqueDates,
    totalBookings: result.bookings.length,
    errors: result.errors,
    dayBreakdown
  };
}