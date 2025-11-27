import { format, isSameDay, getMonth, getDate } from 'date-fns';
import { AnnualLeave } from '@/hooks/useLeaveManagement';

/**
 * Checks if a holiday matches a given date, accounting for recurring holidays.
 * For recurring holidays, matches by month and day regardless of year.
 * For non-recurring holidays, requires exact date match.
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
 * Gets all holidays that match a specific date.
 */
export const getHolidaysForDate = (holidays: AnnualLeave[], targetDate: Date): AnnualLeave[] => {
  return holidays.filter(holiday => isHolidayOnDate(holiday, targetDate));
};

/**
 * Gets a single holiday for a date (first match).
 */
export const getHolidayForDay = (holidays: AnnualLeave[], day: Date): AnnualLeave | null => {
  const matchingHolidays = getHolidaysForDate(holidays, day);
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
  } else {
    lines.push('🏪 Branch-specific');
  }
  
  return lines.join('\n');
};