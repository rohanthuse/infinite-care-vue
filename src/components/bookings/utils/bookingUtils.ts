
import { Booking } from "../BookingTimeGrid";
import { createUTCTimestamp } from '@/utils/timezoneUtils';

// Legacy compatibility exports - these will be removed in future versions
export function createBookingDateTime(dateString: string, timeString: string): string {
  console.warn('createBookingDateTime from bookingUtils is deprecated, use dateUtils instead');
  const dateStr = dateString.includes('T') ? dateString.split('T')[0] : dateString;
  
  // Use timezone-aware conversion utility
  return createUTCTimestamp(dateStr, timeString);
}

export function addDaysToDateString(dateString: string, days: number): string {
  console.warn('addDaysToDateString from bookingUtils is deprecated, use dateUtils instead');
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day) {
    console.error("[addDaysToDateString] Invalid date string:", dateString);
    return dateString;
  }
  
  const tempDate = new Date(Date.UTC(year, month - 1, day));
  tempDate.setUTCDate(tempDate.getUTCDate() + days);
  
  const resultYear = tempDate.getUTCFullYear();
  const resultMonth = String(tempDate.getUTCMonth() + 1).padStart(2, '0');
  const resultDay = String(tempDate.getUTCDate()).padStart(2, '0');
  
  return `${resultYear}-${resultMonth}-${resultDay}`;
}

export function getDayOfWeekFromString(dateString: string): number {
  console.warn('getDayOfWeekFromString from bookingUtils is deprecated, use dateUtils instead');
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
    console.error("[getDayOfWeekFromString] Invalid date components:", { year, month, day, dateString });
    return 0;
  }
  
  const tempDate = new Date(Date.UTC(year, month - 1, day));
  return tempDate.getUTCDay();
}

// Legacy function - use createBookingDateTime instead
export function combineDateAndTimeToISO(date: Date, time: string): string {
  console.warn('combineDateAndTimeToISO is deprecated, use createBookingDateTime with string dates');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return createBookingDateTime(`${yyyy}-${mm}-${dd}`, time);
}

// Filter bookings by search and status
export function filterBookings(
  bookings: Booking[], 
  searchQuery: string, 
  selectedStatuses: string[]
) {
  return bookings.filter(bk => {
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(bk.status);
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (bk.clientName && bk.clientName.toLowerCase().includes(q)) ||
      (bk.carerName && bk.carerName.toLowerCase().includes(q)) ||
      (bk.clientInitials && bk.clientInitials.toLowerCase().includes(q)) ||
      (bk.carerInitials && bk.carerInitials.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });
}

// Get status counts for filters
export function getStatusCounts(bookings: Booking[]): Record<string, number> {
  return bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {});
}
