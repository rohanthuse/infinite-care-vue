export const NEWS2_FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'four_times_daily', label: 'Four Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom Schedule' },
] as const;

export type News2FrequencyValue = typeof NEWS2_FREQUENCY_OPTIONS[number]['value'];

/**
 * Formats a NEWS2 frequency value for display
 * Handles custom schedules stored as "custom:schedule_text"
 */
export const formatNews2Frequency = (frequency: string | undefined, customSchedule?: string): string => {
  if (!frequency) return 'Daily';
  
  // Handle legacy formats
  if (frequency === '12-hourly') return '12-Hourly';
  
  // Handle custom schedule stored inline
  if (frequency.startsWith('custom:')) {
    const customText = frequency.replace('custom:', '');
    return customText ? `Custom: ${customText}` : 'Custom Schedule';
  }
  
  // Handle custom with separate field
  if (frequency === 'custom' && customSchedule) {
    return `Custom: ${customSchedule}`;
  }
  
  if (frequency === 'custom') {
    return 'Custom Schedule';
  }
  
  // Map standard values to readable labels
  const option = NEWS2_FREQUENCY_OPTIONS.find(opt => opt.value === frequency);
  if (option) {
    return option.label;
  }
  
  // Fallback: convert snake_case/kebab-case to readable format
  return frequency
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
};

/**
 * Parses a stored frequency value to extract frequency type and custom schedule
 */
export const parseNews2Frequency = (storedValue: string | undefined): { 
  frequency: string; 
  customSchedule?: string;
} => {
  if (!storedValue) {
    return { frequency: 'daily' };
  }
  
  if (storedValue.startsWith('custom:')) {
    return { 
      frequency: 'custom', 
      customSchedule: storedValue.replace('custom:', '') 
    };
  }
  
  return { frequency: storedValue };
};

/**
 * Combines frequency and custom schedule for storage
 */
export const combineFrequencyForStorage = (
  frequency: string, 
  customSchedule?: string
): string => {
  if (frequency === 'custom' && customSchedule) {
    return `custom:${customSchedule}`;
  }
  return frequency;
};
