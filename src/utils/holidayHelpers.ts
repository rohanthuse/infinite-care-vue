import { format, isSameDay, getMonth, getDate } from 'date-fns';
import { AnnualLeave } from '@/hooks/useLeaveManagement';

/**
 * Checks if a holiday matches a given date, accounting for recurring holidays.
 * For recurring holidays, matches by month and day regardless of year.
 * For non-recurring holidays, requires exact date match.
 * NOTE: This does NOT check staff_id - use isHolidayForStaff for staff-specific checks.
 */
export const isHolidayOnDate = (holiday: AnnualLeave, targetDate: Date): boolean => {
  const holidayDate = new Date(holiday.leave_date);
  
  if (holiday.is_recurring) {
    // For recurring holidays, match month and day only
    return getMonth(holidayDate) === getMonth(targetDate) && 
           getDate(holidayDate) === getDate(targetDate);
  } else {
    // For non-recurring, exact date match
    return isSameDay(holidayDate, targetDate);
  }
};

/**
 * Checks if a holiday applies to a specific staff member on a given date.
 * Returns true if:
 * - The date matches AND
 * - Holiday has no staff_id (applies to all/branch-wide) OR
 * - Holiday staff_id matches the target staff
 */
export const isHolidayForStaff = (
  holiday: AnnualLeave, 
  targetDate: Date, 
  staffId?: string
): boolean => {
  // First check if date matches
  if (!isHolidayOnDate(holiday, targetDate)) {
    return false;
  }
  
  // If holiday has no staff_id, it's a branch/company-wide holiday - applies to everyone
  if (!holiday.staff_id) {
    return true;
  }
  
  // If staffId is provided, check if it matches the holiday's staff_id
  if (staffId) {
    return holiday.staff_id === staffId;
  }
  
  // No staffId provided and holiday is carer-specific - don't apply
  return false;
};

/**
 * Gets all holidays that match a specific date (regardless of staff assignment).
 */
export const getHolidaysForDate = (holidays: AnnualLeave[], targetDate: Date): AnnualLeave[] => {
  return holidays.filter(holiday => isHolidayOnDate(holiday, targetDate));
};

/**
 * Gets holidays that apply to a specific staff member on a date.
 * Includes both staff-specific holidays AND branch-wide holidays.
 */
export const getHolidaysForStaff = (
  holidays: AnnualLeave[], 
  targetDate: Date, 
  staffId?: string
): AnnualLeave[] => {
  return holidays.filter(holiday => isHolidayForStaff(holiday, targetDate, staffId));
};

/**
 * Gets a single holiday for a date (first match) - regardless of staff assignment.
 */
export const getHolidayForDay = (holidays: AnnualLeave[], day: Date): AnnualLeave | null => {
  const matchingHolidays = getHolidaysForDate(holidays, day);
  return matchingHolidays.length > 0 ? matchingHolidays[0] : null;
};

/**
 * Gets a single holiday for a specific staff member on a date.
 * Returns the first matching holiday (staff-specific or branch-wide).
 */
export const getHolidayForStaff = (
  holidays: AnnualLeave[], 
  targetDate: Date, 
  staffId?: string
): AnnualLeave | null => {
  const matchingHolidays = getHolidaysForStaff(holidays, targetDate, staffId);
  return matchingHolidays.length > 0 ? matchingHolidays[0] : null;
};

/**
 * Formats holiday tooltip content.
 */
export const formatHolidayTooltip = (holiday: AnnualLeave, date: Date): string => {
  const lines = [
    `🎄 ${holiday.leave_name}`,
    `📅 ${format(date, 'MMMM d, yyyy')}`,
  ];
  
  if (holiday.is_recurring) {
    lines.push('🔁 Recurring Annual Holiday');
  }
  
  if (holiday.is_company_wide) {
    lines.push('🏢 Company-wide');
  } else if (holiday.staff_id) {
    lines.push('👤 Carer-specific');
  } else {
    lines.push('🏪 Branch-specific');
  }
  
  return lines.join('\n');
};