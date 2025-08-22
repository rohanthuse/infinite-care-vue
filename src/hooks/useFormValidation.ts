import { FormElement } from '@/types/form-builder';
import { z } from 'zod';
import { 
  createDateValidation, 
  createTimeValidation, 
  createPositiveNumberValidation 
} from '@/utils/validationUtils';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  values: Record<string, any>;
}

export const useFormValidation = () => {
  const validateFormData = (elements: FormElement[], formData: Record<string, any>): ValidationResult => {
    const errors: Record<string, string> = {};
    const values: Record<string, any> = {};

    elements.forEach(element => {
      const value = formData[element.id];
      values[element.id] = value;

      // Skip validation for non-input elements
      if (['heading', 'paragraph', 'divider'].includes(element.type)) {
        return;
      }

      // Required field validation
      if (element.required) {
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          errors[element.id] = `${element.label} is required`;
          return;
        }
      }

      // Skip further validation if field is empty and not required
      if (!element.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Type-specific validation
      try {
        switch (element.type) {
          case 'email':
            z.string().email().parse(value);
            break;
          
          case 'tel':
            z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').parse(value);
            break;
          
          case 'number':
            const numElement = element as any;
            let numSchema = z.number();
            if (numElement.min !== undefined) numSchema = numSchema.min(numElement.min);
            if (numElement.max !== undefined) numSchema = numSchema.max(numElement.max);
            numSchema.parse(Number(value));
            break;
          
          case 'date':
            createDateValidation(element.label).parse(value);
            break;
          
          case 'time':
            createTimeValidation(element.label).parse(value);
            break;
          
          case 'checkbox':
            if (!Array.isArray(value)) {
              throw new Error('Checkbox value must be an array');
            }
            break;
          
          case 'select':
          case 'radio':
            const selectElement = element as any;
            if (selectElement.options && !selectElement.options.some((opt: any) => opt.value === value)) {
              throw new Error('Invalid selection');
            }
            break;
        }
      } catch (error) {
        errors[element.id] = error instanceof Error ? error.message : `Invalid ${element.label}`;
      }
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      values
    };
  };

  const validateRequiredFields = (elements: FormElement[], formData: Record<string, any>): string[] => {
    const missingFields: string[] = [];
    
    elements.forEach(element => {
      if (element.required && !['heading', 'paragraph', 'divider'].includes(element.type)) {
        const value = formData[element.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          missingFields.push(element.label);
        }
      }
    });

    return missingFields;
  };

  return {
    validateFormData,
    validateRequiredFields
  };
};