
/**
 * Safely parse JSON with fallback handling for invalid JSON or plain text
 */
export function safeJsonParse<T>(jsonString: any, fallback: T = null as T): T {
  // If the input is already an object, return it as-is
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString as T;
  }

  // If the input is not a string, return fallback
  if (typeof jsonString !== 'string') {
    return fallback;
  }

  // If it's an empty string, return fallback
  if (!jsonString.trim()) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.warn('Failed to parse JSON, returning fallback:', { jsonString, error });
    return fallback;
  }
}

/**
 * Parse GP details from various formats
 */
export function parseGpDetails(gpDetails: any) {
  if (!gpDetails) return null;

  // If it's already an object with the expected structure
  if (typeof gpDetails === 'object' && gpDetails !== null) {
    return {
      name: gpDetails.name || '',
      practice: gpDetails.practice || '',
      phone: gpDetails.phone || ''
    };
  }

  // Try to parse as JSON
  const parsed = safeJsonParse(gpDetails, null);
  if (parsed && typeof parsed === 'object') {
    return {
      name: parsed.name || '',
      practice: parsed.practice || '',
      phone: parsed.phone || ''
    };
  }

  // If it's a plain text string, treat it as the GP name
  if (typeof gpDetails === 'string') {
    return {
      name: gpDetails.trim(),
      practice: '',
      phone: ''
    };
  }

  return null;
}

/**
 * Parse communication preferences from various formats
 */
export function parseCommunicationPreferences(commPrefs: any) {
  if (!commPrefs) return null;

  // If it's already an object with the expected structure
  if (typeof commPrefs === 'object' && commPrefs !== null) {
    return {
      preferred_method: commPrefs.preferred_method || commPrefs.preferredMethod || '',
      ...commPrefs
    };
  }

  // Try to parse as JSON
  const parsed = safeJsonParse(commPrefs, null);
  if (parsed && typeof parsed === 'object') {
    return {
      preferred_method: parsed.preferred_method || parsed.preferredMethod || '',
      ...parsed
    };
  }

  // If it's a plain text string, treat it as the preferred method
  if (typeof commPrefs === 'string') {
    return {
      preferred_method: commPrefs.trim()
    };
  }

  return null;
}
