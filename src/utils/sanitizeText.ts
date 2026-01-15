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
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  // NOTE: Removed .trim() - trimming should only happen on form submission, not during typing
};

/**
 * Recursively sanitizes any value - handles strings, arrays, and objects
 * This is the core function that ensures ALL nested data is sanitized
 */
export const sanitizeAny = (value: unknown): unknown => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle Date objects - convert to ISO string to preserve the value
  // This prevents dates from being converted to {} during sanitization
  if (value instanceof Date) {
    return value.toISOString();
  }
  
  // Handle strings
  if (typeof value === 'string') {
    return sanitizeText(value);
  }
  
  // Handle arrays - recursively sanitize each element
  if (Array.isArray(value)) {
    return value.map(item => sanitizeAny(item));
  }
  
  // Handle objects - recursively sanitize each property
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeAny(val);
    }
    return sanitized;
  }
  
  // Handle primitives (numbers, booleans) - return unchanged
  return value;
};

/**
 * Sanitizes all string values in an object recursively, including arrays
 * Use this for form data before sending to Supabase
 */
export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  return sanitizeAny(data) as T;
};

/**
 * Scans data for problematic characters and returns paths where they exist
 * Useful for debugging and showing user-friendly error messages
 */
export const findProblematicPaths = (data: unknown, currentPath = ''): string[] => {
  const problematicPaths: string[] = [];
  const controlCharRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u0000]/;
  
  if (typeof data === 'string') {
    if (controlCharRegex.test(data)) {
      problematicPaths.push(currentPath || 'root');
    }
  } else if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const paths = findProblematicPaths(item, `${currentPath}[${index}]`);
      problematicPaths.push(...paths);
    });
  } else if (data !== null && typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      const paths = findProblematicPaths(value, newPath);
      problematicPaths.push(...paths);
    }
  }
  
  return problematicPaths;
};

/**
 * Maps field paths to user-friendly tab/section names for error messages
 */
export const getFieldTabName = (path: string): string => {
  const lowerPath = path.toLowerCase();
  
  if (lowerPath.includes('medication')) return 'Medication Schedule';
  if (lowerPath.includes('task')) return 'Tasks';
  if (lowerPath.includes('risk') || lowerPath.includes('fall_risk') || lowerPath.includes('mitigation')) return 'Risk Assessment';
  if (lowerPath.includes('goal')) return 'Care Goals';
  if (lowerPath.includes('activit')) return 'Activities';
  if (lowerPath.includes('service_action')) return 'Service Actions';
  if (lowerPath.includes('about') || lowerPath.includes('personality') || lowerPath.includes('background')) return 'About Me';
  if (lowerPath.includes('medical') || lowerPath.includes('health')) return 'Medical Information';
  if (lowerPath.includes('contact') || lowerPath.includes('emergency')) return 'Key Contacts';
  if (lowerPath.includes('consent')) return 'Consent';
  if (lowerPath.includes('staff') || lowerPath.includes('provider')) return 'Staff Assignment';
  
  return 'Care Plan';
};
