import { z } from "zod";

// UUID validation regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to validate if a string is a valid UUID
export const isValidUUID = (value: string): boolean => {
  return UUID_REGEX.test(value);
};

// Common validation utilities for accounting forms
export const createDateValidation = (fieldName: string) => {
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, `${fieldName} must be a valid date`);
};

export const createTimeValidation = (fieldName: string) => {
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, `${fieldName} must be in HH:MM format`);
};

export const createOptionalTimeValidation = (fieldName: string) => {
  return z
    .string()
    .optional()
    .refine((time) => {
      if (!time || time === '') return true;
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    }, `${fieldName} must be in HH:MM format`);
};

export const createDateRangeValidation = (startField: string, endField: string) => {
  return {
    startDate: createDateValidation(startField),
    endDate: createDateValidation(endField),
    refine: (data: any) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    message: `${startField} must be before or equal to ${endField}`
  };
};

export const createTimeRangeValidation = (startField: string, endField: string) => {
  return {
    startTime: createTimeValidation(startField),
    endTime: createTimeValidation(endField),
    refine: (data: any) => {
      if (!data.startTime || !data.endTime) return true;
      
      const start = new Date(`2000-01-01T${data.startTime}`);
      const end = new Date(`2000-01-01T${data.endTime}`);
      return start < end;
    },
    message: `${startField} must be before ${endField}`
  };
};

// Fixed: This should prevent PAST dates, not future dates
export const createPastDateValidation = (fieldName: string, allowToday: boolean = true) => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, `${fieldName} must be a valid date`)
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (allowToday) {
        return inputDate >= today;
      } else {
        return inputDate > today;
      }
    }, `${fieldName} cannot be in the past`);
};

// Keep the old function name for backward compatibility with a corrected implementation
export const createFutureDateValidation = (fieldName: string, allowToday: boolean = true) => {
  return z.string()
    .min(1, `${fieldName} is required`)
    .refine((date) => {
      const parsedDate = new Date(date);
      return !isNaN(parsedDate.getTime());
    }, `${fieldName} must be a valid date`)
    .refine((date) => {
      const inputDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (allowToday) {
        return inputDate <= today;
      } else {
        return inputDate < today;
      }
    }, `${fieldName} cannot be in the future`);
};

// Configurable backdating policy
export const createDateValidationWithBackdating = (fieldName: string, allowBackdating: boolean = false, allowToday: boolean = true) => {
  if (allowBackdating) {
    return createDateValidation(fieldName); // Allow any valid date
  }
  return createPastDateValidation(fieldName, allowToday);
};

// Enhanced date range validation for bookings
export const createEnhancedDateRangeValidation = (startField: string, endField: string, allowBackdating: boolean = false) => {
  return {
    startDate: createDateValidationWithBackdating(startField, allowBackdating),
    endDate: createDateValidation(endField),
    refine: (data: any) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start <= end;
    },
    message: `${endField} must be on or after ${startField}`
  };
};

export const createPositiveNumberValidation = (fieldName: string, min: number = 0) => {
  return z
    .number()
    .min(min, `${fieldName} must be at least ${min}`)
    .refine((num) => !isNaN(num), `${fieldName} must be a valid number`);
};
