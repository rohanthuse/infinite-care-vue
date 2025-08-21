/**
 * Color utility functions for normalizing colors to HSL format
 * Ensures consistent color handling across the application
 */

/**
 * Converts hex color to HSL values (without hsl() wrapper)
 * @param hex - Hex color string (e.g., "#FF0000" or "FF0000")
 * @returns HSL string in format "360 100% 50%" (suitable for CSS custom properties)
 */
function hexToHsl(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(cleanHex.substr(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substr(2, 2), 16) / 255;
  const b = parseInt(cleanHex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Convert to degrees and percentages, round to avoid floating point issues
  const hDeg = Math.round(h * 360);
  const sPercent = Math.round(s * 100);
  const lPercent = Math.round(l * 100);

  return `${hDeg} ${sPercent}% ${lPercent}%`;
}

/**
 * Extracts HSL values from an HSL string
 * @param hsl - HSL string (e.g., "hsl(360, 100%, 50%)" or "360 100% 50%")
 * @returns HSL string in format "360 100% 50%" (suitable for CSS custom properties)
 */
function extractHslValues(hsl: string): string {
  // Remove hsl() wrapper if present and extract values
  const match = hsl.match(/(\d+)\s*,?\s*(\d+)%\s*,?\s*(\d+)%/);
  if (match) {
    return `${match[1]} ${match[2]}% ${match[3]}%`;
  }
  
  // If already in the correct format, return as is
  if (/^\d+\s+\d+%\s+\d+%$/.test(hsl.trim())) {
    return hsl.trim();
  }
  
  throw new Error(`Invalid HSL format: ${hsl}`);
}

/**
 * Normalizes a color value to HSL format suitable for CSS custom properties
 * @param color - Color in hex, HSL, or other format
 * @returns HSL string in format "360 100% 50%" (suitable for CSS custom properties)
 */
export function normalizeToHslVar(color: string): string {
  if (!color) {
    throw new Error('Color value is required');
  }

  const trimmedColor = color.trim();

  // Handle hex colors
  if (trimmedColor.startsWith('#') || /^[0-9A-Fa-f]{6}$/.test(trimmedColor)) {
    return hexToHsl(trimmedColor);
  }

  // Handle HSL colors
  if (trimmedColor.startsWith('hsl(') || /^\d+\s+\d+%\s+\d+%$/.test(trimmedColor)) {
    return extractHslValues(trimmedColor);
  }

  // Handle RGB colors (convert to hex first, then to HSL)
  const rgbMatch = trimmedColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]);
    const g = parseInt(rgbMatch[2]);
    const b = parseInt(rgbMatch[3]);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return hexToHsl(hex);
  }

  throw new Error(`Unsupported color format: ${color}`);
}