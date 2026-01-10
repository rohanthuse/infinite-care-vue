/**
 * Shared postcode extraction utilities for consistent postcode display
 * across the application (Admin and Carer portals)
 */

// Helper to extract postcode from address string using common patterns
export function extractPostcodeFromAddress(address: string | undefined | null): string {
  if (!address) return '';
  
  // UK postcode pattern (SW1A 1AA, M1 1AE, AL10 9HX, WD17 2AX)
  const ukPostcodeRegex = /\b([A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2})\b/i;
  const ukMatch = address.match(ukPostcodeRegex);
  if (ukMatch) return ukMatch[1].toUpperCase();
  
  // Indian PIN code (6 digits)
  const indianPinRegex = /\b(\d{6})\b/;
  const indianMatch = address.match(indianPinRegex);
  if (indianMatch) return indianMatch[1];
  
  // 5-digit codes (US ZIP)
  const fiveDigitRegex = /\b(\d{5})\b/;
  const fiveDigitMatch = address.match(fiveDigitRegex);
  if (fiveDigitMatch) return fiveDigitMatch[1];
  
  return '';
}

// Helper to get client postcode with priority fallback:
// 1) Structured addresses, 2) pin_code field, 3) Extract from legacy address
export function getClientPostcodeWithFallback(
  structuredAddresses: any[] | null | undefined,
  pinCode: string | null | undefined,
  address: string | null | undefined
): string {
  // Priority 1: Structured addresses
  if (structuredAddresses && structuredAddresses.length > 0) {
    const defaultAddr = structuredAddresses.find((a: any) => a.is_default) || structuredAddresses[0];
    if (defaultAddr?.postcode) return defaultAddr.postcode;
  }
  
  // Priority 2: Direct pin_code field from clients table
  if (pinCode) return pinCode;
  
  // Priority 3: Extract from legacy address using regex
  if (address) {
    return extractPostcodeFromAddress(address);
  }
  
  return '';
}

// Helper to get full address from structured addresses or legacy address
export function getClientDisplayAddress(
  structuredAddresses: any[] | null | undefined,
  legacyAddress: string | null | undefined
): string {
  // Priority 1: Structured addresses
  if (structuredAddresses && structuredAddresses.length > 0) {
    const defaultAddr = structuredAddresses.find((a: any) => a.is_default) || structuredAddresses[0];
    if (defaultAddr) {
      const parts = [
        defaultAddr.address_line_1,
        defaultAddr.address_line_2,
        defaultAddr.city,
        defaultAddr.state_county,
        defaultAddr.postcode,
        defaultAddr.country
      ].filter(Boolean);
      return parts.join(', ');
    }
  }
  
  // Priority 2: Legacy address
  return legacyAddress || '';
}
