/**
 * Sanitizes text input by removing problematic Unicode characters
 * that can cause PostgreSQL JSON parsing errors.
 * 
 * Common culprits:
 * - Null characters (\u0000) from copy-paste
 * - Control characters from Word/PDF
 * - Invalid escape sequences
 */
export const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return '';
  
  return text
    // Remove null characters (main culprit for "unsupported Unicode escape sequence")
    .replace(/\u0000/g, '')
    // Remove other control characters (except newline \n, tab \t, carriage return \r)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace (collapse multiple spaces, trim)
    .trim();
};

/**
 * Sanitizes all string values in an object recursively
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeFormData(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};
