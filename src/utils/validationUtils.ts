
import { z } from "zod";

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

export const createFutureDateValidation = (fieldName: string, allowToday: boolean = true) => {
  return createDateValidation(fieldName).refine((date) => {
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

export const createPositiveNumberValidation = (fieldName: string, min: number = 0) => {
  return z
    .number()
    .min(min, `${fieldName} must be at least ${min}`)
    .refine((num) => !isNaN(num), `${fieldName} must be a valid number`);
};
