
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale = 'en-GB', currency = 'GBP'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats a duration in minutes to a human-readable hours & minutes string
 * Examples: 90 → "1 hr 30 mins", 45 → "45 mins", 120 → "2 hrs"
 */
export function formatDurationHoursMinutes(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '0 mins';
  
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  
  if (hours === 0) {
    return `${mins} ${mins === 1 ? 'min' : 'mins'}`;
  }
  
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
  }
  
  return `${hours} ${hours === 1 ? 'hr' : 'hrs'} ${mins} ${mins === 1 ? 'min' : 'mins'}`;
}

/**
 * Formats decimal hours to a human-readable hours & minutes string
 * Examples: 0.5 → "30 mins", 1.5 → "1 hr 30 mins", 2 → "2 hrs"
 */
export function formatHoursToReadable(hours: number): string {
  if (!hours || hours <= 0) return '0 mins';
  const totalMinutes = Math.round(hours * 60);
  return formatDurationHoursMinutes(totalMinutes);
}
