/**
 * Booking validation utilities
 */

import { isValidDateString, isValidTimeString, isValidDateRange } from './dateUtils';

export interface BookingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BookingSchedule {
  startTime: string;
  endTime: string;
  days?: {
    sun?: boolean;
    mon?: boolean;
    tue?: boolean;
    wed?: boolean;
    thu?: boolean;
    fri?: boolean;
    sat?: boolean;
  };
  services?: string[];
}

export interface BookingFormData {
  clientId?: string;
  carerId?: string;
  fromDate: string | Date;
  untilDate: string | Date;
  schedules: BookingSchedule[];
  recurrenceFrequency?: string;
  notes?: string;
}

/**
 * Validate a single booking schedule
 */
export function validateBookingSchedule(schedule: BookingSchedule): BookingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate time format
  if (!isValidTimeString(schedule.startTime)) {
    errors.push(`Invalid start time format: ${schedule.startTime}`);
  }
  
  if (!isValidTimeString(schedule.endTime)) {
    errors.push(`Invalid end time format: ${schedule.endTime}`);
  }
  
  // Validate time range
  if (schedule.startTime && schedule.endTime) {
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate duration (handle overnight bookings)
    let durationMinutes = endMinutes - startMinutes;
    const isOvernightBooking = durationMinutes < 0;
    
    if (isOvernightBooking) {
      durationMinutes += 1440; // Add 24 hours (1440 minutes)
    }
    
    // Validate: Duration must be at least 15 minutes and max 24 hours
    if (durationMinutes < 15) {
      errors.push(`Booking duration too short: ${durationMinutes} minutes. Minimum is 15 minutes.`);
    }
    
    if (durationMinutes > 1440) {
      errors.push(`Booking duration too long: ${Math.round(durationMinutes / 60)} hours. Maximum is 24 hours.`);
    }
    
    // Check for reasonable booking duration - adjusted for overnight shifts
    if (durationMinutes < 30 && durationMinutes >= 15) {
      warnings.push(`Short booking duration: ${durationMinutes} minutes`);
    }
    
    // For overnight bookings, provide helpful info
    if (isOvernightBooking) {
      console.log(`[validateBookingSchedule] Overnight booking detected: ${schedule.startTime} - ${schedule.endTime}, Duration: ${durationMinutes} minutes (${(durationMinutes / 60).toFixed(2)} hours)`);
    }
  }
  
  // Validate day selection
  if (schedule.days) {
    const hasSelectedDays = Object.values(schedule.days).some(Boolean);
    if (!hasSelectedDays) {
      warnings.push('No days selected for this schedule');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate complete booking form data
 */
export function validateBookingFormData(data: BookingFormData): BookingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Convert dates to strings
  const fromDateStr = typeof data.fromDate === 'string' 
    ? (data.fromDate.includes('T') ? data.fromDate.split('T')[0] : data.fromDate)
    : data.fromDate.toISOString().split('T')[0];
    
  const untilDateStr = typeof data.untilDate === 'string' 
    ? (data.untilDate.includes('T') ? data.untilDate.split('T')[0] : data.untilDate)
    : data.untilDate.toISOString().split('T')[0];
  
  // Validate date format and range
  if (!isValidDateString(fromDateStr)) {
    errors.push(`Invalid start date: ${fromDateStr}`);
  }
  
  if (!isValidDateString(untilDateStr)) {
    errors.push(`Invalid end date: ${untilDateStr}`);
  }
  
  if (!isValidDateRange(fromDateStr, untilDateStr)) {
    errors.push('Start date must be before or equal to end date');
  }
  
  // Validate schedules
  if (!data.schedules || data.schedules.length === 0) {
    errors.push('At least one schedule is required');
  } else {
    data.schedules.forEach((schedule, index) => {
      const scheduleValidation = validateBookingSchedule(schedule);
      scheduleValidation.errors.forEach(error => {
        errors.push(`Schedule ${index + 1}: ${error}`);
      });
      scheduleValidation.warnings.forEach(warning => {
        warnings.push(`Schedule ${index + 1}: ${warning}`);
      });
    });
  }
  
  // Validate recurrence frequency
  if (data.recurrenceFrequency) {
    const frequency = parseInt(data.recurrenceFrequency);
    if (isNaN(frequency) || frequency < 1 || frequency > 52) {
      errors.push('Recurrence frequency must be between 1 and 52 weeks');
    }
  }
  
  // Validate IDs format (basic UUID check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (data.clientId && !uuidRegex.test(data.clientId)) {
    errors.push('Invalid client ID format');
  }
  
  if (data.carerId && !uuidRegex.test(data.carerId)) {
    errors.push('Invalid carer ID format');
  }
  
  // Check for required fields based on context
  if (!data.clientId) {
    warnings.push('No client selected - booking will be unassigned');
  }
  
  if (!data.carerId) {
    warnings.push('No carer selected - booking will need manual assignment');
  }

  // Add validation for service selection when no staff is assigned
  const hasServices = data.schedules.some(schedule => 
    schedule.services && schedule.services.length > 0 && schedule.services[0]
  );
  if (!data.carerId && !hasServices) {
    warnings.push('No service selected - booking will be created without a specific service');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate single booking update data
 */
export function validateBookingUpdate(updateData: {
  startTime?: string;
  endTime?: string;
  date?: string;
  clientId?: string;
  carerId?: string;
  status?: string;
}): BookingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate times if provided
  if (updateData.startTime && !isValidTimeString(updateData.startTime)) {
    errors.push(`Invalid start time: ${updateData.startTime}`);
  }
  
  if (updateData.endTime && !isValidTimeString(updateData.endTime)) {
    errors.push(`Invalid end time: ${updateData.endTime}`);
  }
  
  // Validate time range if both provided
  if (updateData.startTime && updateData.endTime) {
    const [startHour, startMin] = updateData.startTime.split(':').map(Number);
    const [endHour, endMin] = updateData.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    // Calculate duration (handle overnight bookings)
    let durationMinutes = endMinutes - startMinutes;
    if (durationMinutes < 0) {
      durationMinutes += 1440; // Add 24 hours for overnight bookings
    }
    
    // Validate duration
    if (durationMinutes < 15) {
      errors.push('Booking duration must be at least 15 minutes');
    }
    
    if (durationMinutes > 1440) {
      errors.push('Booking duration cannot exceed 24 hours');
    }
  }
  
  // Validate date if provided
  if (updateData.date && !isValidDateString(updateData.date)) {
    errors.push(`Invalid date: ${updateData.date}`);
  }
  
  // Validate status if provided
  const validStatuses = ['assigned', 'unassigned', 'done', 'in-progress', 'cancelled', 'departed', 'suspended'];
  if (updateData.status && !validStatuses.includes(updateData.status)) {
    errors.push(`Invalid status: ${updateData.status}. Must be one of: ${validStatuses.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}